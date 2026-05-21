import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Compass, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Leaf,
  Info,
  Sparkles,
  Loader2,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  SOIL_TEXTURES, 
  SOIL_MOISTURE, 
  DRAINAGE_CLASSES, 
  LCA_CLASSES, 
  LCA_SUBCLASSES, 
  MUNSELL_HUES,
  LOGOS
} from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { submitFieldData, reverseGeocode, type GeocodeResult } from '../lib/api';
import { sunPosition, describeSun, type SunPosition } from '../lib/sun';
import type { Project } from '../types';

interface PhotoData {
  id: string;
  url: string;
  timestamp: string;
  gps?: { lat: number; lng: number; accuracyM?: number; altitudeM?: number; altitudeAccuracyM?: number };
  heading?: number;
  weather?: string;
  label: string;
  lcaClass?: string;
  lcaSubclass?: string;
  siftData?: string;
  elevation?: string;
  topography?: string;
  elevationSource?: string;
  aiAnalysis?: {
    munsell?: string;
    texture?: string;
    notes?: string;
  };
}

// A test pit is just a photo + an optional one-line note. Everything else
// (texture, Munsell, LCA class, horizons, drainage, mottling, structure,
// pit base depth, water table, rooting depth) is derived in Claude Cowork
// from the photo + ECCC + DEM + property_research.py at report-drafting time.
interface TestPit {
  id: string;
  notes: string;
  photo?: PhotoData;
}

// Site-level: a single optional notes field for anything Cowork can't see
// from photos + aerials (e.g. owner-mentioned past fill, smell of peat).
interface SiteInfo {
  generalNotes: string;
}

const FIELD_DRAFT_KEY = 'tas_field_draft';

interface FieldFormProps {
  role?: 'admin' | 'field';
  projects?: Project[];
}

export function FieldForm({ role = 'field', projects = [] }: FieldFormProps) {
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(FIELD_DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const draft = loadDraft();

  const [session, setSession] = useState(draft?.session || {
    address: '',
    fileNumber: '',
    reportType: 'Site Assessment',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    weather: 'Sunny',
    projectName: '',
  });

  const [photos, setPhotos] = useState<PhotoData[]>(draft?.photos || []);
  const [testPits, setTestPits] = useState<TestPit[]>(draft?.testPits || []);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(draft?.siteInfo || {
    generalNotes: '',
  });
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(draft?.savedAt || null);

  const clearDraft = () => {
    localStorage.removeItem(FIELD_DRAFT_KEY);
    setDraftSavedAt(null);
  };

  // Auto-save session + pit notes + siteInfo to localStorage whenever they change.
  // Photos are excluded (too large; saved to phone gallery via per-pit "Save" button).
  useEffect(() => {
    const payload = {
      session,
      testPits: testPits.map(p => ({ ...p, photo: undefined })), // exclude photo blobs
      siteInfo,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIELD_DRAFT_KEY, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  }, [session, testPits, siteInfo]);

  // Profile photo per pit is required for submit (per report-lessons May 14)
  const pitsWithoutPhotos = testPits.filter(p => !p.photo);

  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracyM?: number; altitudeM?: number; altitudeAccuracyM?: number } | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSoilGuide, setShowSoilGuide] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [showLCAGuide, setShowLCAGuide] = useState(false);
  const [activePitId, setActivePitId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Auto-captured operational context ─────────────────────────────────
  // Weather is intentionally NOT fetched here — Cowork pulls authoritative
  // ECCC historical data for the exact GPS + timestamp when drafting the report.
  const [geocode, setGeocode] = useState<GeocodeResult | null>(null);
  const [sunAtFirstPhoto, setSunAtFirstPhoto] = useState<SunPosition | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // ── Live compass HUD ──────────────────────────────────────────────────
  // So the field tech sees their heading BEFORE snapping the photo and can
  // orient deliberately ("face S 180° then take the overview").
  const [liveHeading, setLiveHeading] = useState<number | null>(null);
  type CompassPermState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'unsupported';
  const [compassPerm, setCompassPerm] = useState<CompassPermState>('unknown');

  // On non-iOS (Android, desktop) deviceorientation typically just works.
  // On iOS 13+, requires explicit user gesture to call requestPermission().
  useEffect(() => {
    const DOE = typeof window !== 'undefined' ? (window as any).DeviceOrientationEvent : undefined;
    if (!DOE) {
      setCompassPerm('unsupported');
      return;
    }
    // If requestPermission exists (iOS), wait for user gesture.
    if (typeof DOE.requestPermission === 'function') {
      // Will be auto-granted if previously granted — but we still need a gesture
      // to call requestPermission. Stay in 'unknown' until the user taps.
      return;
    }
    // Android / desktop — attach immediately.
    setCompassPerm('granted');
  }, []);

  useEffect(() => {
    if (compassPerm !== 'granted') return;
    const handler = (e: any) => {
      const h = e.webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) : null);
      if (h != null && !Number.isNaN(h)) {
        setLiveHeading(Math.round(h));
      }
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [compassPerm]);

  const requestCompassPermission = async () => {
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      setCompassPerm('requesting');
      try {
        const result = await DOE.requestPermission();
        setCompassPerm(result === 'granted' ? 'granted' : 'denied');
      } catch {
        setCompassPerm('denied');
      }
    } else {
      setCompassPerm('granted');
    }
  };

  const headingToDir = (h: number) =>
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(h / 45) % 8];

  // Fires once when first GPS lock arrives. Reverse-geocode catches address
  // typos; sun angle is pure math used by Cowork to correct Munsell color
  // estimation. Both run silently — field tech does nothing extra.
  const hydrateContextFromGps = async (lat: number, lng: number) => {
    if (hydrated) return;
    setHydrated(true);
    const g = await reverseGeocode(lat, lng);
    if (g) setGeocode(g);
    setSunAtFirstPhoto(sunPosition(lat, lng, new Date()));
  };

  // Build the watermarked photo as a data URL. Pure function so we can use it
  // for both single-photo download and the bulk "Download all" flow.
  //
  // Design philosophy: include ONLY objective auto-captured data. NO human-
  // analysis fields (texture, Munsell, LCA class, drainage class). Opus reads
  // the photo itself when she uploads to Claude Cowork at home.
  const renderWatermarkedPhoto = async (
    photo: PhotoData,
    pit?: TestPit,
    pitNumber?: number,
  ): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Load the photo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('photo load failed'));
    }).catch(() => {});

    // Try to load the TITRIN logo (white version) for branding
    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const li = new Image();
        li.crossOrigin = 'anonymous';
        li.onload = () => resolve(li);
        li.onerror = () => reject(new Error('logo load failed'));
        li.src = '/logo-white.png';
      });
    } catch { /* logo optional — use text fallback below */ }

    const W = img.width;
    const fs = Math.max(20, Math.floor(W / 48));    // base font size
    const padX = Math.floor(W * 0.045);              // ~4.5% horizontal padding
    const lineGap = fs * 1.35;
    const titleGap = fs * 1.55;

    // Build the content lines (each is `null` if not available — skipped)
    const t = photo.timestamp || new Date().toLocaleString();
    const headingDir = photo.heading != null
      ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(photo.heading / 45) % 8]
      : null;
    const gpsLine = photo.gps
      ? (() => {
          const acc = photo.gps.accuracyM != null ? ` ±${photo.gps.accuracyM}m` : '';
          const alt = photo.gps.altitudeM != null ? ` | Alt: ${photo.gps.altitudeM}m ASL` : '';
          return `GPS: ${photo.gps.lat.toFixed(6)}, ${photo.gps.lng.toFixed(6)}${acc}${alt}`;
        })()
      : null;
    // Pit measurements are derived by Opus from the photo + tape, not entered
    // by the field tech. So no measureLine to render here anymore.
    const pitMeasureLine: string | null = null;
    const sunBit = sunAtFirstPhoto && sunAtFirstPhoto.isDaylight
      ? `Sun ${sunAtFirstPhoto.elevation}° ${['N','NE','E','SE','S','SW','W','NW'][Math.round(sunAtFirstPhoto.azimuth/45)%8]}`
      : null;
    const contextLine = sunBit;

    // Title (large) + subtitle line
    const titleText = `TAS · ${session.address || 'Unknown site'}`;
    const subBits = [
      pitNumber != null ? `Pit ${pitNumber}` : photo.label,
      headingDir && photo.heading != null ? `Facing ${headingDir} (${Math.round(photo.heading)}°)` : null,
    ].filter(Boolean);
    const subtitleText = subBits.join(' · ');

    // Italic label line (e.g., "Site overview", "Test Pit 1") below data lines
    const italicLabel = photo.label || null;

    // Compute footer height from how many lines we actually have
    const dataLines = [gpsLine, t, pitMeasureLine, contextLine].filter(Boolean) as string[];
    const footerH = Math.round(
      padX * 0.9                                  // top padding
      + fs * 1.5                                  // title row
      + lineGap                                   // subtitle row
      + lineGap * dataLines.length                // each data line
      + (italicLabel ? lineGap * 0.85 : 0)        // italic label row
      + padX * 0.9                                // bottom padding
    );

    canvas.width = W;
    canvas.height = img.height + footerH;

    // Draw photo
    ctx.drawImage(img, 0, 0);

    // Draw footer — solid brand-blue (matches her example)
    ctx.fillStyle = '#0f1a26';                    // deep slate-blue
    ctx.fillRect(0, img.height, W, footerH);

    // Logo block on the right (matches her example aesthetic)
    const logoBlockW = Math.floor(footerH * 1.1);
    const logoBlockH = footerH;
    if (logoImg) {
      // Black tile background + logo image
      ctx.fillStyle = '#000000';
      ctx.fillRect(W - logoBlockW, img.height, logoBlockW, logoBlockH);
      // Fit logo with ~75% of block, centred
      const targetH = Math.floor(logoBlockH * 0.65);
      const scale = targetH / logoImg.height;
      const drawW = logoImg.width * scale;
      const drawH = logoImg.height * scale;
      const cx = W - logoBlockW + (logoBlockW - drawW) / 2;
      const cy = img.height + (logoBlockH - drawH) / 2;
      ctx.drawImage(logoImg, cx, cy, drawW, drawH);
    } else {
      // Text fallback
      ctx.fillStyle = '#000000';
      ctx.fillRect(W - logoBlockW, img.height, logoBlockW, logoBlockH);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `900 ${fs * 0.95}px Inter, sans-serif`;
      ctx.fillText('TITRIN', W - logoBlockW / 2, img.height + logoBlockH / 2 - fs * 0.1);
      ctx.font = `${fs * 0.55}px Inter, sans-serif`;
      ctx.fillStyle = '#86efac';                  // brand-green-ish
      ctx.fillText('AgriSoil Solutions', W - logoBlockW / 2, img.height + logoBlockH / 2 + fs * 0.7);
    }

    // Text region (everything left of the logo block)
    const textRight = W - logoBlockW - padX;
    let y = img.height + padX * 0.9 + fs;
    ctx.textAlign = 'left';

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${fs * 1.25}px Inter, sans-serif`;
    ctx.fillText(titleText, padX, y);
    y += titleGap;

    // Subtitle
    ctx.fillStyle = '#cbd5e1';                    // slate-300
    ctx.font = `600 ${fs * 0.85}px Inter, sans-serif`;
    ctx.fillText(subtitleText, padX, y);
    y += lineGap;

    // Data lines (smaller, lighter, monospace)
    ctx.font = `${fs * 0.75}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = '#94a3b8';                    // slate-400
    for (const line of dataLines) {
      const maxW = textRight - padX;
      let drawn = line;
      while (ctx.measureText(drawn).width > maxW && drawn.length > 8) {
        drawn = drawn.slice(0, -2);
      }
      ctx.fillText(drawn, padX, y);
      y += lineGap;
    }

    // Italic photo-label line at the very bottom
    if (italicLabel) {
      ctx.font = `italic ${fs * 0.7}px Inter, sans-serif`;
      ctx.fillStyle = '#64748b';                  // slate-500 — even quieter
      ctx.fillText(italicLabel, padX, y);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const downloadWatermarkedPhoto = async (
    photo: PhotoData,
    pit?: TestPit,
    pitNumber?: number,
    filenameLabel?: string,
  ) => {
    const dataUrl = await renderWatermarkedPhoto(photo, pit, pitNumber);
    if (!dataUrl) return;
    const safeAddr = (session.address || 'site').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
    const tag = filenameLabel || (pitNumber != null ? `pit${pitNumber}` : 'photo');
    const link = document.createElement('a');
    link.download = `TAS-${safeAddr}-${tag}-${photo.id}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const [bulkDownloading, setBulkDownloading] = useState(false);
  // Tracks which photos have been saved to the gallery in this session.
  // Each entry is `pit:<id>:<photoId>:<dataHash>` for pit photos
  // or `site:<id>` for site overview photos. We include a hash of the pit's
  // data fields so editing base depth / water table / etc. invalidates the
  // saved badge and prompts the tech to re-save.
  const [savedPhotoKeys, setSavedPhotoKeys] = useState<Set<string>>(new Set());

  const pitSaveKey = (pit: TestPit) => {
    if (!pit.photo) return null;
    // Hash pit notes so editing them invalidates the saved badge and prompts re-save
    const notesSig = pit.notes || '-';
    return `pit:${pit.id}:${pit.photo.id}:${notesSig}`;
  };
  const siteSaveKey = (photoId: string) => `site:${photoId}`;

  const markSaved = (key: string) => {
    setSavedPhotoKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const savePitPhoto = async (pit: TestPit, index: number) => {
    if (!pit.photo) return;
    await downloadWatermarkedPhoto(pit.photo, pit, index + 1);
    const key = pitSaveKey(pit);
    if (key) markSaved(key);
  };

  const saveSitePhoto = async (photo: PhotoData) => {
    await downloadWatermarkedPhoto(photo, undefined, undefined, photo.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase());
    markSaved(siteSaveKey(photo.id));
  };

  const downloadAllPhotos = async () => {
    if (bulkDownloading) return;
    setBulkDownloading(true);
    try {
      // Pit photos (most important — these are the LCA evidence)
      for (let i = 0; i < testPits.length; i++) {
        const pit = testPits[i];
        if (pit.photo) {
          await downloadWatermarkedPhoto(pit.photo, pit, i + 1);
          // brief delay so the browser doesn't drop simultaneous downloads
          await new Promise(r => setTimeout(r, 350));
        }
      }
      // Site overview / loose photos
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        await downloadWatermarkedPhoto(p, undefined, undefined, p.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase());
        await new Promise(r => setTimeout(r, 350));
      }
    } finally {
      setBulkDownloading(false);
    }
  };

  const hasAnyPhoto = testPits.some(p => p.photo) || photos.length > 0;

  const analyzeSoilImage = async (photoId: string, base64Data: string, isPit: boolean = false) => {
    setIsAnalyzing(photoId);
    try {
      const photo = isPit 
        ? testPits.find(p => p.photo?.id === photoId)?.photo 
        : photos.find(p => p.id === photoId);
      
      const gpsContext = photo?.gps 
        ? `Location: Lat ${photo.gps.lat.toFixed(6)}, Lng ${photo.gps.lng.toFixed(6)}. ` 
        : "";

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: `${gpsContext}Analyze this soil photo for a professional Land Capability Assessment in British Columbia (primarily Lower Mainland). 
                1. Provide the estimated Munsell color (Hue, Value, Chroma).
                2. Provide the estimated soil texture.
                3. Suggest an LCA Class (1-7).
                4. Search for Soil Information Finder Tool (SIFT) or BC Soil Mapping data for these coordinates. Provide a one-sentence summary of the mapped soil unit/series.
                5. Retrieve the elevation (ASL in meters) and local topography (slope, aspect) using verifiable sources like BC Terrain Map, NRCan, or Google Maps Elevation.
                
                CRITICAL: If you cannot find verifiable data for SIFT, elevation, or topography, return "Not sure" for that specific field. DO NOT guess.
                Format the response as JSON.` },
              { inlineData: { data: base64Data.split(',')[1], mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              munsell: { type: Type.STRING, description: "Hue Value/Chroma" },
              texture: { type: Type.STRING },
              lcaClass: { type: Type.STRING, description: "Class 1 to Class 7" },
              siftData: { type: Type.STRING, description: "Summary of mapped soil unit from SIFT/BC Soil Mapping. Return 'Not sure' if unavailable." },
              elevation: { type: Type.STRING, description: "Elevation in meters (e.g. 150m ASL). Return 'Not sure' if unavailable." },
              topography: { type: Type.STRING, description: "Brief topography description. Return 'Not sure' if unavailable." },
              elevationSource: { type: Type.STRING, description: "The specific verifiable source used (e.g. BC SIFT, NRCan). Return 'Not sure' if unavailable." },
              notes: { type: Type.STRING }
            },
            required: ["munsell", "texture", "lcaClass", "siftData", "elevation", "topography", "elevationSource", "notes"]
          }
        }
      });

      const result = JSON.parse(response.text);
      if (isPit) {
        setTestPits(prev => prev.map(pit => pit.photo?.id === photoId ? {
          ...pit,
          lcaClass: result.lcaClass,
          photo: {
            ...pit.photo!,
            lcaClass: result.lcaClass,
            siftData: result.siftData,
            elevation: result.elevation,
            topography: result.topography,
            elevationSource: result.elevationSource,
            aiAnalysis: {
              munsell: result.munsell,
              texture: result.texture,
              notes: result.notes
            }
          }
        } : pit));
      } else {
        setPhotos(prev => prev.map(p => p.id === photoId ? { 
          ...p, 
          lcaClass: result.lcaClass,
          siftData: result.siftData,
          elevation: result.elevation,
          topography: result.topography,
          elevationSource: result.elevationSource,
          aiAnalysis: {
            munsell: result.munsell,
            texture: result.texture,
            notes: result.notes
          }
        } : p));
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  useEffect(() => {
    if (isCapturing) {
      setGpsStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : undefined,
            altitudeM: pos.coords.altitude != null ? Math.round(pos.coords.altitude) : undefined,
            altitudeAccuracyM: pos.coords.altitudeAccuracy != null ? Math.round(pos.coords.altitudeAccuracy) : undefined,
          });
          setGpsStatus('success');
        },
        () => setGpsStatus('error'),
        { enableHighAccuracy: true }
      );

      const handleOrientation = (e: any) => {
        if (e.webkitCompassHeading) {
          setCurrentHeading(e.webkitCompassHeading);
        } else if (e.alpha) {
          setCurrentHeading(360 - e.alpha);
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [isCapturing]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.strokeStyle = '#1a2b3c';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };

  // captureMode says which section initiated the camera (so we know where the
  // photo belongs when it comes back). Single-step capture: button → camera →
  // photo lands in the right section automatically.
  const [captureMode, setCaptureMode] = useState<'pit' | 'overview' | null>(null);

  const startCapture = (mode: 'pit' | 'overview') => {
    setCaptureMode(mode);
    setIsCapturing(true);
    // small delay so GPS effect kicks off before camera opens
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !captureMode) {
      setIsCapturing(false);
      setCaptureMode(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoId = Math.random().toString(36).substr(2, 9);
      const base64Data = reader.result as string;
      const newPhoto: PhotoData = {
        id: photoId,
        url: base64Data,
        timestamp: new Date().toLocaleString(),
        gps: currentGps || undefined,
        heading: currentHeading || undefined,
        label: captureMode === 'pit'
          ? `Test Pit ${testPits.length + 1}`
          : (photos.length === 0 ? 'Site Overview' : `Site Overview ${photos.length + 1}`),
      };

      if (captureMode === 'pit') {
        const newPit: TestPit = {
          id: Math.random().toString(36).substr(2, 9),
          notes: '',
          photo: newPhoto,
        };
        setTestPits(prev => [...prev, newPit]);
      } else {
        setPhotos(prev => [...prev, newPhoto]);
      }

      setIsCapturing(false);
      setCaptureMode(null);

      if (newPhoto.gps) {
        hydrateContextFromGps(newPhoto.gps.lat, newPhoto.gps.lng);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addTestPit = () => {
    const newPit: TestPit = {
      id: Math.random().toString(36).substr(2, 9),
      notes: '',
    };
    setTestPits([...testPits, newPit]);
  };

  const updateTestPit = (id: string, field: keyof TestPit, value: any) => {
    setTestPits(testPits.map(pit => pit.id === id ? { ...pit, [field]: value } : pit));
  };

  const removeTestPit = (id: string) => {
    setTestPits(testPits.filter(pit => pit.id !== id));
  };

  const submitToAdmin = async () => {
    if (!session.address) {
      setSubmitError('Site address is required');
      setSubmitState('error');
      return;
    }
    if (testPits.length === 0 && photos.length === 0) {
      setSubmitError('Take at least one photo (pit or site overview) before submitting');
      setSubmitState('error');
      return;
    }
    if (pitsWithoutPhotos.length > 0) {
      setSubmitError(`${pitsWithoutPhotos.length} test pit${pitsWithoutPhotos.length === 1 ? '' : 's'} missing a photo.`);
      setSubmitState('error');
      return;
    }
    setSubmitState('submitting');
    setSubmitError(null);

    const firstGps = photos.find(p => p.gps)?.gps ?? testPits.find(p => p.photo?.gps)?.photo?.gps;

    // Lean payload — photos are the primary evidence (in the gallery on phone).
    // This submit is a quiet backup with just enough JSON for admin overview.
    const pitsPayload = testPits.map((p, i) => ({
      id: p.id,
      pitNumber: i + 1,
      excavatedAt: p.photo?.timestamp ?? new Date().toISOString(),
      gps: p.photo?.gps,
      profilePhotoId: p.photo?.id,
      fieldNotes: p.notes || undefined,
    }));

    const sitePayload = {
      generalNotes: siteInfo.generalNotes || undefined,
    };

    // Auto-captured operational context. Weather is intentionally NOT here —
    // Cowork pulls historical ECCC data for the exact GPS + photo timestamps
    // when drafting the report, which is the authoritative regulatory source.
    const opsContext = {
      reverseGeocode: geocode || undefined,
      sunAtFirstPhoto: sunAtFirstPhoto || undefined,
    };

    const submission = await submitFieldData({
      submittedBy: role,
      siteAddress: session.address,
      projectName: session.projectName || session.fileNumber || undefined,
      gps: firstGps,
      pits: pitsPayload,
      site: sitePayload,
      observations: siteInfo.generalNotes || undefined,
      photoCount: photos.length + testPits.filter(p => p.photo).length,
      rawData: {
        session,
        opsContext,
      },
    });

    if (submission) {
      setSubmitState('success');
      setTimeout(() => setSubmitState('idle'), 4000);
    } else {
      setSubmitError('Could not reach the server. Your photos are still safe in your gallery — just upload to Claude at home.');
      setSubmitState('error');
    }
  };

  const clearForm = () => {
    if (window.confirm('Clear all field data?')) {
      setPhotos([]);
      setTestPits([]);
      setSiteInfo({ generalNotes: '' });
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto px-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-black text-brand-blue tracking-tight">Field Visit</h1>
          <p className="text-slate-500 font-medium text-sm">
            Take photos. Download each one. Upload to Claude at home.
          </p>
        </div>
        {(testPits.length > 0 || photos.length > 0) && (
          <button
            onClick={() => { clearForm(); clearDraft(); }}
            className="text-[11px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest whitespace-nowrap pt-2"
          >
            Reset
          </button>
        )}
      </div>

      {/* Live compass HUD — face your direction, see your heading, then snap.
          On iOS 13+ requires explicit gesture to enable. */}
      <div className="flex items-center justify-center">
        {compassPerm === 'granted' && liveHeading != null && (
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-brand-blue text-white rounded-2xl shadow-lg shadow-brand-blue/20">
            <Compass className="w-5 h-5" />
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Facing</span>
              <span className="text-2xl font-black tabular-nums">{headingToDir(liveHeading)}</span>
              <span className="text-sm font-bold text-white/80 tabular-nums">{liveHeading}°</span>
            </div>
          </div>
        )}
        {compassPerm === 'granted' && liveHeading == null && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold">
            <Compass className="w-4 h-4" />
            Compass ready — move phone to calibrate
          </div>
        )}
        {(compassPerm === 'unknown' || compassPerm === 'requesting' || compassPerm === 'denied') && (
          <button
            onClick={requestCompassPermission}
            disabled={compassPerm === 'requesting'}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-colors",
              compassPerm === 'denied'
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/15"
            )}
          >
            <Compass className="w-4 h-4" />
            {compassPerm === 'requesting'
              ? 'Requesting…'
              : compassPerm === 'denied'
              ? 'Compass disabled — tap to retry'
              : 'Enable compass'}
          </button>
        )}
        {compassPerm === 'unsupported' && (
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Compass not supported on this device</span>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="space-y-8">
          {/* Session Details */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-brand-blue">Session Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length > 0 && (
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Project (optional — pre-fills address + tags this submission)
                  </label>
                  <select
                    value={session.projectName || ''}
                    onChange={e => {
                      const picked = e.target.value;
                      const proj = projects.find(p => p.name === picked);
                      // If user picks a project, auto-fill address from project name when our address is empty.
                      // The project "name" field in this codebase is typically "<address> — TAS <num>" so we
                      // extract the address chunk before " — " if present.
                      const addressFromProject = proj
                        ? (proj.name.split(' — ')[0] || proj.name)
                        : '';
                      const fileFromProject = proj
                        ? (proj.name.match(/TAS\s*[\d.]+/i)?.[0] ?? '')
                        : '';
                      setSession({
                        ...session,
                        projectName: picked,
                        address: session.address || addressFromProject,
                        fileNumber: session.fileNumber || fileFromProject,
                      });
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all font-medium"
                  >
                    <option value="">— No project linked —</option>
                    {projects.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Site Address</label>
                <input
                  type="text"
                  value={session.address}
                  onChange={e => setSession({...session, address: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all"
                  placeholder="Street, City, Province"
                />
              </div>
            </div>
          </section>

          {/* Site Overview Photos */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-brand-blue">Site Overview Photos</h2>
              <button
                onClick={() => startCapture('overview')}
                disabled={isCapturing}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-blue/90 disabled:opacity-50 transition-all"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>

            {photos.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-100 rounded-xl">
                Tap "Take Photo" for landscape shots of the site + surroundings
              </p>
            ) : (
              <div className="space-y-3">
                  {photos.map(photo => (
                    <div key={photo.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
                        <span className="text-[11px] font-black text-brand-blue uppercase tracking-widest">{photo.label}</span>
                        <button
                          onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <img src={photo.url} alt={photo.label} className="w-full max-h-80 object-cover" />
                      <div className="p-3">
                        {(() => {
                          const saved = savedPhotoKeys.has(siteSaveKey(photo.id));
                          return (
                            <button
                              onClick={() => saveSitePhoto(photo)}
                              className={cn(
                                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                                saved
                                  ? "bg-brand-green/15 text-brand-green border border-brand-green/30"
                                  : "bg-brand-blue text-white shadow-md hover:scale-[1.01]"
                              )}
                            >
                              {saved ? (
                                <><CheckCircle2 className="w-4 h-4" /> Downloaded ✓</>
                              ) : (
                                <><Download className="w-4 h-4" /> Download Photo</>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* Test Pit Photos — one-step capture, prominent download per photo */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-brand-blue">Test Pit Photos</h2>
              <button
                onClick={() => startCapture('pit')}
                disabled={isCapturing}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-blue/90 disabled:opacity-50 transition-all"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>

            {testPits.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-100 rounded-xl">
                Tap "Take Photo" to capture a soil pit with tape measure visible
              </p>
            ) : (
              <div className="space-y-3">
                {testPits.map((pit, index) => pit.photo && (
                  <div key={pit.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
                      <span className="text-[11px] font-black text-brand-blue uppercase tracking-widest">Pit {index + 1}</span>
                      <button
                        onClick={() => removeTestPit(pit.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <img src={pit.photo.url} alt={`Pit ${index + 1}`} className="w-full max-h-80 object-cover" />
                    <div className="p-3">
                      {(() => {
                        const key = pitSaveKey(pit);
                        const saved = key ? savedPhotoKeys.has(key) : false;
                        return (
                          <button
                            onClick={() => savePitPhoto(pit, index)}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                              saved
                                ? "bg-brand-green/15 text-brand-green border border-brand-green/30"
                                : "bg-brand-blue text-white shadow-md hover:scale-[1.01]"
                            )}
                          >
                            {saved ? (
                              <><CheckCircle2 className="w-4 h-4" /> Downloaded ✓</>
                            ) : (
                              <><Download className="w-4 h-4" /> Download Photo</>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Hidden file input — single shared input, captureMode tells handler where the photo goes */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

      </div>

    </div>
  );
}
