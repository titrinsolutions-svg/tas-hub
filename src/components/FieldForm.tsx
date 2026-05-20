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
  gps?: { lat: number; lng: number };
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

interface TestPit {
  id: string;
  depth: string;
  texture: string;
  moisture: string;
  color: string;
  munsell?: {
    hue: string;
    value: string;
    chroma: string;
  };
  lcaClass?: string;
  lcaSubclass?: string;
  notes: string;
  photo?: PhotoData;

  // ── P-10 raw evidence (new) ────────────────────────────────────────────
  pitBaseDepthCm?: number;       // tape-measured pit base (refusal / C horizon)
  waterTablePresent?: boolean;   // free water encountered?
  waterTableDepthCm?: number;    // if present
  rootingDepthCm?: number;       // deepest visible root
  // Liability framing — captured at site, used by Cowork to write the report
  hoursSinceLastRain?: number;
  rainfallNote?: string;
}

// Site-level inputs for the field tech. KEPT INTENTIONALLY MINIMAL.
// Everything else (slope, aspect, surrounding land use, vegetation, ponding,
// current land use) is derived in Cowork from aerial imagery + DEM + photos.
// The field tech is a body to dig and photograph properly.
interface SiteInfo {
  assessmentAreaHa: string;  // optional, for pit density warning only
  generalNotes: string;       // free text — anything unusual that aerials won't show
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
  const [observations, setObservations] = useState(draft?.observations || {
    drainage: 'Well Drained',
    smell: 'None',
    setbacks: 'Compliant',
    ownerInput: '',
    issues: '',
    generalNotes: ''
  });
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(draft?.siteInfo || {
    assessmentAreaHa: '',
    generalNotes: '',
  });
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(draft?.savedAt || null);

  const saveDraft = (updates: { session?: typeof session; testPits?: typeof testPits; observations?: typeof observations }) => {
    const payload = {
      session: updates.session ?? session,
      testPits: updates.testPits ?? testPits,
      observations: updates.observations ?? observations,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIELD_DRAFT_KEY, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  };

  const clearDraft = () => {
    localStorage.removeItem(FIELD_DRAFT_KEY);
    setDraftSavedAt(null);
  };

  // Auto-save session, testPits, observations, siteInfo to localStorage whenever they change.
  // Photos are excluded (can be large base64 strings).
  useEffect(() => {
    const payload = {
      session,
      testPits: testPits.map(p => ({ ...p, photo: undefined })), // exclude photo blobs
      observations,
      siteInfo,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIELD_DRAFT_KEY, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  }, [session, testPits, observations, siteInfo]);

  // ── Pit density calculation (P-10 §3.1 requires ≥1 pit per 1-5 ha) ───────
  const pitDensityWarning = (() => {
    const areaHa = parseFloat(siteInfo.assessmentAreaHa);
    if (!areaHa || areaHa <= 0 || testPits.length === 0) return null;
    const haPerPit = areaHa / testPits.length;
    if (haPerPit > 5) {
      return {
        level: 'error' as const,
        message: `${testPits.length} pit${testPits.length === 1 ? '' : 's'} on ${areaHa} ha = 1 per ${haPerPit.toFixed(1)} ha — BELOW P-10 minimum of 1 per 5 ha. Add more pits or justify in report.`,
      };
    }
    if (haPerPit > 1) {
      return {
        level: 'ok' as const,
        message: `${testPits.length} pit${testPits.length === 1 ? '' : 's'} on ${areaHa} ha = 1 per ${haPerPit.toFixed(1)} ha ✓ within P-10 (1 per 1-5 ha)`,
      };
    }
    return {
      level: 'ok' as const,
      message: `${testPits.length} pit${testPits.length === 1 ? '' : 's'} on ${areaHa} ha = 1 per ${haPerPit.toFixed(2)} ha ✓ exceeds P-10 minimum density`,
    };
  })();

  // Profile photo per pit is required for submit (per report-lessons May 14)
  const pitsWithoutPhotos = testPits.filter(p => !p.photo);

  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
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
      ? `GPS: ${photo.gps.lat.toFixed(6)}, ${photo.gps.lng.toFixed(6)}`
      : null;
    const pitMeasureBits = pit ? [
      pit.pitBaseDepthCm != null && `Base ${pit.pitBaseDepthCm}cm`,
      pit.waterTablePresent && (pit.waterTableDepthCm != null
        ? `Water ${pit.waterTableDepthCm}cm`
        : 'Water present'),
      pit.rootingDepthCm != null && `Roots ${pit.rootingDepthCm}cm`,
    ].filter(Boolean) : [];
    const pitMeasureLine = pitMeasureBits.length > 0 ? pitMeasureBits.join(' · ') : null;
    const rainBit = pit?.hoursSinceLastRain != null ? `Rain ${pit.hoursSinceLastRain}h ago` : null;
    const sunBit = sunAtFirstPhoto && sunAtFirstPhoto.isDaylight
      ? `Sun ${sunAtFirstPhoto.elevation}° ${['N','NE','E','SE','S','SW','W','NW'][Math.round(sunAtFirstPhoto.azimuth/45)%8]}`
      : null;
    const contextLine = [rainBit, sunBit].filter(Boolean).join(' · ') || null;

    // Title (large) + subtitle line
    const titleText = `TAS · ${session.address || 'Unknown site'}`;
    const subBits = [
      pitNumber != null ? `Pit ${pitNumber}` : photo.label,
      headingDir && photo.heading != null ? `Facing ${headingDir} (${Math.round(photo.heading)}°)` : null,
    ].filter(Boolean);
    const subtitleText = subBits.join(' · ');

    // Compute footer height from how many lines we actually have
    const dataLines = [gpsLine, t, pitMeasureLine, contextLine].filter(Boolean) as string[];
    const footerH = Math.round(
      padX * 0.9                                  // top padding
      + fs * 1.5                                  // title row
      + lineGap                                   // subtitle row
      + lineGap * dataLines.length                // each data line
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

    // Data lines (smaller, lighter)
    ctx.font = `${fs * 0.75}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = '#94a3b8';                    // slate-400
    for (const line of dataLines) {
      // Trim to textRight if too long (shouldn't happen at these sizes but safety)
      const maxW = textRight - padX;
      let drawn = line;
      while (ctx.measureText(drawn).width > maxW && drawn.length > 8) {
        drawn = drawn.slice(0, -2);
      }
      ctx.fillText(drawn, padX, y);
      y += lineGap;
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
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          weather: session.weather,
          label: activePitId 
            ? `Test Pit ${testPits.findIndex(p => p.id === activePitId) + 1}` 
            : (photos.length === 0 ? 'Site Overview' : `Photo ${photos.length + 1}`)
        };

        if (activePitId) {
          setTestPits(prev => prev.map(pit => pit.id === activePitId ? { ...pit, photo: newPhoto } : pit));
          analyzeSoilImage(photoId, base64Data, true);
          setActivePitId(null);
        } else {
          setPhotos([...photos, newPhoto]);
          analyzeSoilImage(photoId, base64Data, false);
        }
        setIsCapturing(false);

        // Auto-fetch weather + geocode + sun angle as soon as we have a GPS lock.
        // This runs once per submission (idempotent — hydrateContextFromGps no-ops if
        // we've already fetched). Field tech does NOTHING extra for this.
        if (newPhoto.gps) {
          hydrateContextFromGps(newPhoto.gps.lat, newPhoto.gps.lng);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addTestPit = () => {
    const newPit: TestPit = {
      id: Math.random().toString(36).substr(2, 9),
      depth: '',
      texture: 'Loam',
      moisture: 'Moist',
      color: '',
      munsell: { hue: '10YR', value: '4', chroma: '3' },
      lcaClass: 'Class 1',
      lcaSubclass: 'X - Cumulative minor limitations',
      notes: ''
    };
    setTestPits([...testPits, newPit]);
  };

  const updateTestPit = (id: string, field: keyof TestPit, value: any) => {
    setTestPits(testPits.map(pit => pit.id === id ? { ...pit, [field]: value } : pit));
  };

  const removeTestPit = (id: string) => {
    setTestPits(testPits.filter(pit => pit.id !== id));
  };

  const generateNotesCard = () => {
    const text = `
SITE VISIT NOTES
----------------
Date: ${session.date}
Weather: ${session.weather}
Client: ${session.clientName}
File: ${session.fileNumber}
Address: ${session.address}

TEST PITS:
${testPits.map((p, i) => `Pit ${i+1}: ${p.depth}cm, ${p.texture}, ${p.moisture}. Munsell: ${p.munsell?.hue} ${p.munsell?.value}/${p.munsell?.chroma}. LCA: ${p.lcaClass} (${p.lcaSubclass}). ${p.notes}`).join('\n')}

OBSERVATIONS:
Drainage: ${observations.drainage}
Smell: ${observations.smell}
Setbacks: ${observations.setbacks}
Issues: ${observations.issues}

PHOTOS: ${photos.length} captured.
${photos.map(p => `- ${p.label}: ${p.lcaClass || 'N/A'}. Munsell: ${p.aiAnalysis?.munsell || 'N/A'}, Texture: ${p.aiAnalysis?.texture || 'N/A'}. SIFT: ${p.siftData || 'N/A'}. Elev: ${p.elevation || 'N/A'}, Topo: ${p.topography || 'N/A'} (Source: ${p.elevationSource || 'N/A'}). GPS: ${p.gps ? `${p.gps.lat}, ${p.gps.lng}` : 'N/A'}`).join('\n')}

SIGNATURE: ${signature ? 'Captured' : 'Pending'}
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert('Notes copied to clipboard for Claude!');
  };

  const submitToAdmin = async () => {
    if (!session.address) {
      setSubmitError('Site address is required');
      setSubmitState('error');
      return;
    }
    if (testPits.length === 0) {
      setSubmitError('Add at least one test pit before submitting');
      setSubmitState('error');
      return;
    }
    if (pitsWithoutPhotos.length > 0) {
      setSubmitError(`${pitsWithoutPhotos.length} test pit${pitsWithoutPhotos.length === 1 ? '' : 's'} missing a profile photo. Per ALC P-10, every pit needs a photo with a visible tape measure before submission.`);
      setSubmitState('error');
      return;
    }
    setSubmitState('submitting');
    setSubmitError(null);

    const observationsText = [
      `Drainage: ${observations.drainage}`,
      `Smell: ${observations.smell}`,
      `Setbacks: ${observations.setbacks}`,
      observations.ownerInput && `Owner input: ${observations.ownerInput}`,
      observations.issues && `Issues: ${observations.issues}`,
      observations.generalNotes && `Notes: ${observations.generalNotes}`,
    ].filter(Boolean).join('\n');

    const firstGps = photos.find(p => p.gps)?.gps;

    // ── Structured P-10 evidence (consumed by Claude Cowork desktop) ─────
    const pitsPayload = testPits.map((p, i) => ({
      id: p.id,
      pitNumber: i + 1,
      excavatedAt: p.photo?.timestamp ?? new Date().toISOString(),
      gps: p.photo?.gps,
      pitBaseDepthCm: p.pitBaseDepthCm,
      waterTablePresent: p.waterTablePresent,
      waterTableDepthCm: p.waterTableDepthCm,
      rootingDepthCm: p.rootingDepthCm,
      hoursSinceLastRain: p.hoursSinceLastRain,
      rainfallNote: p.rainfallNote,
      profilePhotoId: p.photo?.id,
      fieldNotes: p.notes,
      aiQualityFlags: undefined,
      aiMunsellEstimate: p.photo?.aiAnalysis?.munsell,
      aiTextureEstimate: p.photo?.aiAnalysis?.texture,
    }));

    const sitePayload = {
      assessmentAreaHa: parseFloat(siteInfo.assessmentAreaHa) || undefined,
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
      // Legacy passthroughs (so existing admin renderer keeps working)
      testPits: testPits.map(p => ({
        depth: p.depth,
        texture: p.texture,
        moisture: p.moisture,
        munsell: p.munsell,
        lcaClass: p.lcaClass,
        lcaSubclass: p.lcaSubclass,
        notes: p.notes,
      })),
      observations: observationsText,
      photoCount: photos.length,
      rawData: {
        session,
        photoLabels: photos.map(p => ({
          label: p.label,
          gps: p.gps,
          lcaClass: p.lcaClass,
          munsell: p.aiAnalysis?.munsell,
          texture: p.aiAnalysis?.texture,
          elevation: p.elevation,
          topography: p.topography,
        })),
        signaturePresent: Boolean(signature),
        opsContext,
      },
    });

    if (submission) {
      setSubmitState('success');
      setTimeout(() => setSubmitState('idle'), 4000);
    } else {
      setSubmitError('Could not reach the server. Your draft is still saved locally — try again later.');
      setSubmitState('error');
    }
  };

  const clearForm = () => {
    if (window.confirm('Clear all field data?')) {
      setPhotos([]);
      setTestPits([]);
      setSignature(null);
      setObservations({
        drainage: 'Well Drained',
        smell: 'None',
        setbacks: 'Compliant',
        ownerInput: '',
        issues: '',
        generalNotes: ''
      });
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-blue tracking-tight">Field Data Collection</h1>
          <p className="text-slate-500 font-medium">Professional site assessment & soil logging</p>
          {draftSavedAt && (
            <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Draft auto-saved {new Date(draftSavedAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => { clearForm(); clearDraft(); }}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 font-bold text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={generateNotesCard}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              title="Copy a text summary to clipboard (does NOT submit to admin)"
            >
              <FileText className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={submitToAdmin}
              disabled={submitState === 'submitting'}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm transition-all",
                submitState === 'success' && "bg-brand-green/15 text-brand-green",
                submitState === 'error' && "bg-red-100 text-red-700",
                submitState === 'submitting' && "opacity-70 cursor-wait"
              )}
              title="Quiet backup — also stores in Netlify Blobs"
            >
              {submitState === 'submitting' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : submitState === 'success' ? (
                <><CheckCircle2 className="w-4 h-4" /> Submitted</>
              ) : submitState === 'error' ? (
                <><AlertCircle className="w-4 h-4" /> Retry</>
              ) : (
                <><Save className="w-4 h-4" /> Submit (backup)</>
              )}
            </button>
            <button
              onClick={downloadAllPhotos}
              disabled={!hasAnyPhoto || bulkDownloading}
              className={cn(
                "flex items-center gap-2 px-6 py-2 text-white rounded-xl font-bold shadow-lg transition-all",
                hasAnyPhoto && !bulkDownloading
                  ? "bg-brand-blue shadow-brand-blue/20 hover:scale-105"
                  : "bg-slate-300 cursor-not-allowed"
              )}
              title="Save all photos to your gallery with watermarked metadata. Upload to Claude Cowork at home."
            >
              {bulkDownloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Download className="w-4 h-4" /> Download all photos</>
              )}
            </button>
          </div>
          {submitState === 'error' && submitError && (
            <p className="text-xs text-red-600 font-medium max-w-xs text-right">{submitError}</p>
          )}
          {submitState === 'success' && (
            <p className="text-xs text-brand-green font-medium">Tish will see this in the Projects view.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Session & Photos */}
        <div className="lg:col-span-2 space-y-8">
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Client Name</label>
                <input
                  type="text"
                  value={session.clientName}
                  onChange={e => setSession({...session, clientName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all"
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">File Number</label>
                <input
                  type="text"
                  value={session.fileNumber}
                  onChange={e => setSession({...session, fileNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all"
                  placeholder="e.g. TAS-2024-001"
                />
              </div>
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

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Weather Condition</label>
                <div className="flex gap-2">
                  {['Sunny', 'Cloudy', 'Rainy', 'Windy'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSession({...session, weather: w})}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-1",
                        session.weather === w 
                          ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20" 
                          : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      {w === 'Sunny' && <Sun className="w-4 h-4" />}
                      {w === 'Cloudy' && <Cloud className="w-4 h-4" />}
                      {w === 'Rainy' && <CloudRain className="w-4 h-4" />}
                      {w === 'Windy' && <Wind className="w-4 h-4" />}
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Optional: assessment area for pit density check + free-form site notes.
              Everything else (slope, aspect, vegetation, surrounding land uses, ponding)
              is derived in Cowork from aerials + DEM + photos. */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-blue">Site (optional)</h2>
                <p className="text-[11px] font-medium text-slate-500">Slope, vegetation, surrounding land uses are derived in Cowork from aerials. Only fill what aerials can't see.</p>
              </div>
            </div>

            {/* Auto-captured context — field tech sees what was grabbed silently */}
            {(geocode || sunAtFirstPhoto) && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Auto-captured context</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-700">
                  {geocode?.displayName && (
                    <div>
                      <span className="font-bold text-slate-500">Verified address:</span> {geocode.displayName}
                    </div>
                  )}
                  {sunAtFirstPhoto && (
                    <div>
                      <span className="font-bold text-slate-500">Sun at first photo:</span> {describeSun(sunAtFirstPhoto)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 italic">
                    Weather (incl. rainfall history) is pulled by Cowork from ECCC at report time.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Assessment Area (ha) — optional</label>
                <input
                  type="number"
                  step="0.01"
                  value={siteInfo.assessmentAreaHa}
                  onChange={e => setSiteInfo({ ...siteInfo, assessmentAreaHa: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green"
                  placeholder="leave blank to use parcel area"
                />
                {pitDensityWarning && (
                  <p className={cn(
                    "text-[10px] font-bold mt-1",
                    pitDensityWarning.level === 'error' ? "text-red-600" : "text-brand-green"
                  )}>
                    {pitDensityWarning.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Anything Cowork should know (optional)</label>
                <textarea
                  value={siteInfo.generalNotes}
                  onChange={e => setSiteInfo({ ...siteInfo, generalNotes: e.target.value })}
                  placeholder="e.g. previous fill on east half; owner mentioned a tile drain at 80 cm"
                  className="w-full h-[58px] px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green resize-none"
                />
              </div>
            </div>
          </section>

          {/* Photo Documentation */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-brand-blue">Photo Documentation</h2>
              </div>
              <button 
                onClick={() => {
                  setIsCapturing(true);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-green/10 text-brand-green rounded-xl font-bold text-sm hover:bg-brand-green/20 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </div>

            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <ImageIcon className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium text-sm">No photos captured yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="relative h-64 overflow-hidden bg-slate-100">
                      <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => downloadWatermarkedPhoto(photo)}
                          className="p-2.5 bg-white/90 backdrop-blur-md text-brand-blue rounded-xl shadow-lg hover:bg-white transition-all"
                          title="Download Professional Record"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                          className="p-2.5 bg-white/90 backdrop-blur-md text-red-500 rounded-xl shadow-lg hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Professional Data Card (Underneath Photo) */}
                    <div className="p-5 space-y-4 bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <img src={LOGOS.color} alt="TAS" className="h-6 w-auto" />
                          <div className="h-4 w-[1px] bg-slate-200" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue leading-none">Titrin AgriSoil</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Professional Site Record</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-600">{photo.timestamp}</div>
                          <div className="text-[9px] font-black text-brand-green uppercase tracking-widest mt-0.5">{session.fileNumber}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3 h-3 text-brand-green" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GPS</span>
                          </div>
                          <div className="text-[10px] font-bold text-brand-blue truncate">
                            {photo.gps ? `${photo.gps.lat.toFixed(4)}, ${photo.gps.lng.toFixed(4)}` : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Compass className="w-3 h-3 text-brand-gold" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Heading</span>
                          </div>
                          <div className="text-[10px] font-bold text-brand-blue">
                            {photo.heading !== undefined ? `${Math.round(photo.heading)}°` : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            {photo.weather === 'Sunny' && <Sun className="w-3 h-3 text-yellow-500" />}
                            {photo.weather === 'Cloudy' && <Cloud className="w-3 h-3 text-slate-400" />}
                            {photo.weather === 'Rainy' && <CloudRain className="w-3 h-3 text-blue-400" />}
                            {photo.weather === 'Windy' && <Wind className="w-3 h-3 text-slate-400" />}
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weather</span>
                          </div>
                          <div className="text-[10px] font-bold text-brand-blue">{photo.weather || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Soil Data Section */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-brand-green" />
                            <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Soil Classification</span>
                          </div>
                          {isAnalyzing === photo.id && <Loader2 className="w-3 h-3 text-brand-green animate-spin" />}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">LCA Class</label>
                            <select 
                              value={photo.lcaClass || 'Class 1'}
                              onChange={(e) => setPhotos(photos.map(p => p.id === photo.id ? {...p, lcaClass: e.target.value} : p))}
                              className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-[10px] font-bold text-brand-blue focus:ring-1 focus:ring-brand-green transition-all"
                            >
                              {LCA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texture</label>
                            <select 
                              value={photo.aiAnalysis?.texture || 'Loam'}
                              onChange={(e) => setPhotos(photos.map(p => p.id === photo.id ? {...p, aiAnalysis: {...p.aiAnalysis, texture: e.target.value}} : p))}
                              className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-[10px] font-bold text-brand-blue focus:ring-1 focus:ring-brand-green transition-all"
                            >
                              {SOIL_TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Munsell Color</label>
                          <input 
                            type="text" 
                            value={photo.aiAnalysis?.munsell || ''}
                            onChange={(e) => setPhotos(photos.map(p => p.id === photo.id ? {...p, aiAnalysis: {...p.aiAnalysis, munsell: e.target.value}} : p))}
                            className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-[10px] font-bold text-brand-blue focus:ring-1 focus:ring-brand-green transition-all"
                            placeholder="e.g. 10YR 4/3"
                          />
                        </div>

                        {photo.siftData && (
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Info className="w-2.5 h-2.5 text-brand-gold" />
                              <span className="text-[8px] font-black text-brand-gold uppercase tracking-widest">SIFT Mapping</span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500 leading-tight italic">
                              {photo.siftData}
                            </p>
                          </div>
                        )}

                        {(photo.elevation || photo.topography) && (
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex gap-4 mb-1">
                              {photo.elevation && (
                                <div className="flex-1">
                                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Elevation</div>
                                  <div className="text-[10px] font-bold text-brand-blue">{photo.elevation}</div>
                                </div>
                              )}
                              {photo.topography && (
                                <div className="flex-[2]">
                                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Topography</div>
                                  <div className="text-[10px] font-bold text-brand-blue truncate" title={photo.topography}>{photo.topography}</div>
                                </div>
                              )}
                            </div>
                            {photo.elevationSource && (
                              <div className="text-[7px] text-slate-400 italic">
                                Source: {photo.elevationSource}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <input 
                          type="text" 
                          value={photo.label}
                          onChange={(e) => setPhotos(photos.map(p => p.id === photo.id ? {...p, label: e.target.value} : p))}
                          className="w-full bg-transparent border-none p-0 font-black text-sm text-brand-blue focus:ring-0 uppercase tracking-tight placeholder:text-slate-300"
                          placeholder="PHOTO LABEL"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Test Pits & Soil Logs */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue">
                  <Leaf className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-brand-blue">Soil Logs & Test Pits</h2>
              </div>
              <button 
                onClick={addTestPit}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-blue/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Pit
              </button>
            </div>

            <div className="space-y-4">
              {testPits.map((pit, index) => (
                <div key={pit.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-brand-blue uppercase tracking-wider text-xs">Test Pit #{index + 1}</h3>
                    <button onClick={() => removeTestPit(pit.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Depth (cm)</label>
                      <input 
                        type="number" 
                        value={pit.depth}
                        onChange={e => updateTestPit(pit.id, 'depth', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all"
                        placeholder="e.g. 120"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Texture</label>
                        <button 
                          onClick={() => setShowSoilGuide(true)}
                          className="text-[9px] font-black text-brand-green uppercase tracking-widest hover:underline"
                        >
                          Guide
                        </button>
                      </div>
                      <select 
                        value={pit.texture}
                        onChange={e => updateTestPit(pit.id, 'texture', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all appearance-none"
                      >
                        {SOIL_TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Moisture</label>
                      <select 
                        value={pit.moisture}
                        onChange={e => updateTestPit(pit.id, 'moisture', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all appearance-none"
                      >
                        {SOIL_MOISTURE.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Munsell Color Selection */}
                    <div className="md:col-span-3 grid grid-cols-3 gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Munsell Hue</label>
                        <select 
                          value={pit.munsell?.hue}
                          onChange={e => updateTestPit(pit.id, 'munsell', { ...pit.munsell, hue: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-brand-blue"
                        >
                          {MUNSELL_HUES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Value</label>
                        <input 
                          type="number" 
                          value={pit.munsell?.value}
                          onChange={e => updateTestPit(pit.id, 'munsell', { ...pit.munsell, value: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-brand-blue"
                          min="0" max="10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Chroma</label>
                        <input 
                          type="number" 
                          value={pit.munsell?.chroma}
                          onChange={e => updateTestPit(pit.id, 'munsell', { ...pit.munsell, chroma: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-brand-blue"
                          min="0" max="20"
                        />
                      </div>
                    </div>

                    {/* LCA Classification */}
                    <div className="md:col-span-3 grid grid-cols-2 gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LCA Class</label>
                          <button 
                            onClick={() => setShowLCAGuide(true)}
                            className="text-[9px] font-black text-brand-gold uppercase tracking-widest hover:underline"
                          >
                            LCA Guide
                          </button>
                        </div>
                        <select 
                          value={pit.lcaClass}
                          onChange={e => updateTestPit(pit.id, 'lcaClass', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-brand-blue"
                        >
                          {LCA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">LCA Subclass</label>
                        <select 
                          value={pit.lcaSubclass}
                          onChange={e => updateTestPit(pit.id, 'lcaSubclass', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-brand-blue"
                        >
                          {LCA_SUBCLASSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* P-10 Raw Evidence (Cowork desktop derives horizons, drainage class, mottles from the photo) */}
                    <div className="md:col-span-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-200/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">P-10 Raw Evidence</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pit Base Depth (cm)</label>
                          <input
                            type="number"
                            value={pit.pitBaseDepthCm ?? ''}
                            onChange={e => updateTestPit(pit.id, 'pitBaseDepthCm', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg text-sm"
                            placeholder="e.g. 90"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rooting Depth (cm)</label>
                          <input
                            type="number"
                            value={pit.rootingDepthCm ?? ''}
                            onChange={e => updateTestPit(pit.id, 'rootingDepthCm', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg text-sm"
                            placeholder="deepest root"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={!!pit.waterTablePresent}
                            onChange={e => updateTestPit(pit.id, 'waterTablePresent', e.target.checked)}
                            className="w-4 h-4 accent-brand-blue"
                          />
                          Free water encountered in pit
                        </label>
                        {pit.waterTablePresent && (
                          <input
                            type="number"
                            value={pit.waterTableDepthCm ?? ''}
                            onChange={e => updateTestPit(pit.id, 'waterTableDepthCm', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg text-sm"
                            placeholder="Water depth from surface (cm)"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200/40">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hours since rain</label>
                          <input
                            type="number"
                            value={pit.hoursSinceLastRain ?? ''}
                            onChange={e => updateTestPit(pit.id, 'hoursSinceLastRain', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg text-sm"
                            placeholder="for liability framing"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rainfall note</label>
                          <input
                            type="text"
                            value={pit.rainfallNote ?? ''}
                            onChange={e => updateTestPit(pit.id, 'rainfallNote', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-lg text-sm"
                            placeholder="e.g. heavy rain yesterday"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Notes / Anything Cowork should know</label>
                      <textarea
                        value={pit.notes}
                        onChange={e => updateTestPit(pit.id, 'notes', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all h-20 resize-none"
                        placeholder="Anything unusual, drainage pattern observed, previous tile drains, etc."
                      />
                    </div>

                    {/* Test Pit Photo Section */}
                    <div className="md:col-span-3 pt-2">
                      {pit.photo ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                          <img src={pit.photo.url} alt={`Pit ${index + 1}`} className="w-full h-48 object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => downloadWatermarkedPhoto(pit.photo!, pit, index + 1)}
                              className="p-3 bg-white text-brand-blue rounded-xl font-bold shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span className="text-xs">Download Watermarked</span>
                            </button>
                            <button 
                              onClick={() => updateTestPit(pit.id, 'photo', undefined)}
                              className="p-3 bg-white text-red-500 rounded-xl font-bold shadow-lg hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                            <div className="px-3 py-1 bg-brand-blue/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                              Pit #{index + 1} Photo
                            </div>
                            {pit.photo.siftData && (
                              <div className="px-3 py-1 bg-brand-gold/90 backdrop-blur-md text-white rounded-lg text-[8px] font-bold uppercase tracking-widest max-w-[200px] truncate">
                                SIFT: {pit.photo.siftData}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setActivePitId(pit.id);
                            setIsCapturing(true);
                            fileInputRef.current?.click();
                          }}
                          className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-all"
                        >
                          <Camera className="w-8 h-8" />
                          <span className="text-xs font-bold uppercase tracking-widest">Capture Pit Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {testPits.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No test pits logged yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Observations & Status */}
        <div className="space-y-8">
          {/* Site Observations */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-brand-blue">Site Observations</h2>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed border-l-2 border-amber-200 pl-3">
                Only fields Opus can't get from photos + aerials. Drainage class is derived from pit morphology — don't enter it here.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Smell / Odor</label>
                <input
                  type="text"
                  value={observations.smell}
                  onChange={e => setObservations({...observations, smell: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all"
                  placeholder="e.g. None, peat, septic, sulfur"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Setbacks</label>
                <select
                  value={observations.setbacks}
                  onChange={e => setObservations({...observations, setbacks: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all appearance-none"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Variance Required">Variance Required</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Owner Input / History</label>
                <textarea
                  value={observations.ownerInput}
                  onChange={e => setObservations({...observations, ownerInput: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all h-24 resize-none"
                  placeholder="What did the owner mention? Past fill, tile drains, prior reports?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Critical Issues</label>
                <textarea
                  value={observations.issues}
                  onChange={e => setObservations({...observations, issues: e.target.value})}
                  className="w-full px-4 py-3 bg-red-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 transition-all h-24 resize-none text-red-900 placeholder:text-red-300"
                  placeholder="Any red flags?"
                />
              </div>

              {/* Signature Pad */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agrologist Signature</label>
                  <button 
                    onClick={clearSignature}
                    className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
                <div className="relative bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden h-32">
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={128}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  {!signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                      Sign Here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Soil Texture Guide Modal */}
      <AnimatePresence>
        {showSoilGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-blue/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-green/10 rounded-xl text-brand-green">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-brand-blue tracking-tight">Soil Texture Guide</h2>
              </div>
              
              <div className="space-y-4 text-sm text-slate-600 font-medium">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-brand-blue font-bold mb-1">Sand</h4>
                  <p className="text-xs">Gritty, does not form a ball when moist.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-brand-blue font-bold mb-1">Loam</h4>
                  <p className="text-xs">Balanced mix. Forms a ball that breaks easily.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-brand-blue font-bold mb-1">Clay</h4>
                  <p className="text-xs">Sticky, forms long ribbons when squeezed.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSoilGuide(false)}
                className="w-full mt-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-blue/20"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* LCA Guide Modal */}
      <AnimatePresence>
        {showLCAGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-blue/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
                  <Compass className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-brand-blue tracking-tight">Land Capability Assessment (LCA) Guide</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 font-medium">
                <div className="space-y-3">
                  <h3 className="text-brand-blue font-black uppercase tracking-widest text-xs">Capability Classes</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-brand-green">Class 1:</span> No significant limitations.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-brand-green">Class 2:</span> Moderate limitations.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-brand-gold">Class 3:</span> Moderately severe limitations.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-brand-gold">Class 4:</span> Severe limitations.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-red-500">Class 5:</span> Very severe limitations (pasture only).
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-brand-blue font-black uppercase tracking-widest text-xs">Common Subclasses</h3>
                  <div className="space-y-2">
                    <div className="p-2 text-xs">
                      <span className="font-bold">W:</span> Excess water / poor drainage.
                    </div>
                    <div className="p-2 text-xs">
                      <span className="font-bold">T:</span> Topography / slope issues.
                    </div>
                    <div className="p-2 text-xs">
                      <span className="font-bold">P:</span> Stoniness.
                    </div>
                    <div className="p-2 text-xs">
                      <span className="font-bold">D:</span> Undesirable structure / permeability.
                    </div>
                    <div className="p-2 text-xs">
                      <span className="font-bold">M:</span> Moisture deficiency / droughtiness.
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowLCAGuide(false)}
                className="w-full mt-8 py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-blue/20"
              >
                Close Guide
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
