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
}

const FIELD_DRAFT_KEY = 'tas_field_draft';

interface FieldFormProps {
  role?: 'admin' | 'field';
}

export function FieldForm({ role = 'field' }: FieldFormProps) {
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
    weather: 'Sunny'
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

  // Auto-save session, testPits, observations to localStorage whenever they change.
  // Photos are excluded (can be large base64 strings).
  useEffect(() => {
    const payload = {
      session,
      testPits: testPits.map(p => ({ ...p, photo: undefined })), // exclude photo blobs
      observations,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FIELD_DRAFT_KEY, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  }, [session, testPits, observations]);

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

  const downloadWatermarkedPhoto = async (photo: PhotoData, customLabel?: string, notes?: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = photo.url;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const padding = 280; // Increased padding for notes
    canvas.width = img.width;
    canvas.height = img.height + padding;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw footer area
    ctx.fillStyle = '#1a2b3c'; // brand-blue
    ctx.fillRect(0, img.height, canvas.width, padding);

    // Draw text
    ctx.fillStyle = '#ffffff';
    const fontSize = Math.max(14, Math.floor(img.width / 45));
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    
    const margin = 40;
    const lineSpacing = fontSize * 1.4;
    let currentY = img.height + margin + 10;

    // Line 1: Label & File Number
    ctx.fillText(`${(customLabel || photo.label).toUpperCase()} | FILE: ${session.fileNumber}`, margin, currentY);
    
    // Line 2: Date & Time & Weather
    currentY += lineSpacing;
    ctx.font = `${fontSize * 0.8}px Inter, sans-serif`;
    ctx.fillText(`DATE: ${photo.timestamp} | WEATHER: ${photo.weather || 'N/A'}`, margin, currentY);

    // Line 3: GPS & Heading
    currentY += lineSpacing;
    const gpsText = photo.gps ? `GPS: ${photo.gps.lat.toFixed(6)}, ${photo.gps.lng.toFixed(6)}` : 'GPS: N/A';
    const headingText = photo.heading !== undefined ? `HEADING: ${Math.round(photo.heading)}°` : 'HEADING: N/A';
    ctx.fillText(`${gpsText} | ${headingText}`, margin, currentY);

    // Line 4: Soil Data
    currentY += lineSpacing;
    const lcaText = photo.lcaClass ? `LCA: ${photo.lcaClass}` : 'LCA: N/A';
    const munsellText = photo.aiAnalysis?.munsell ? `MUNSELL: ${photo.aiAnalysis.munsell}` : 'MUNSELL: N/A';
    const textureText = photo.aiAnalysis?.texture ? `TEXTURE: ${photo.aiAnalysis.texture}` : 'TEXTURE: N/A';
    ctx.fillText(`${lcaText} | ${munsellText} | ${textureText}`, margin, currentY);

    // Line 5: SIFT Data
    if (photo.siftData) {
      currentY += lineSpacing;
      ctx.font = `${fontSize * 0.7}px Inter, sans-serif`;
      ctx.fillStyle = '#cbd5e1'; // slate-300
      ctx.fillText(`SIFT MAPPING: ${photo.siftData}`, margin, currentY);
      ctx.fillStyle = '#ffffff';
    }

    // Line 6: Elevation & Topography
    if (photo.elevation || photo.topography) {
      currentY += lineSpacing;
      ctx.font = `${fontSize * 0.7}px Inter, sans-serif`;
      ctx.fillStyle = '#94a3b8'; // slate-400
      const elevText = photo.elevation ? `ELEVATION: ${photo.elevation}` : 'ELEVATION: N/A';
      const topoText = photo.topography ? `TOPOGRAPHY: ${photo.topography}` : 'TOPOGRAPHY: N/A';
      const sourceText = photo.elevationSource ? ` (Source: ${photo.elevationSource})` : '';
      ctx.fillText(`${elevText} | ${topoText}${sourceText}`, margin, currentY);
      ctx.fillStyle = '#ffffff';
    }

    // Line 7: Notes (if any)
    if (notes || photo.aiAnalysis?.notes) {
      currentY += lineSpacing * 1.2;
      ctx.font = `italic ${fontSize * 0.7}px Inter, sans-serif`;
      ctx.fillStyle = '#94a3b8'; // slate-400
      const noteText = `NOTES: ${notes || photo.aiAnalysis?.notes}`;
      // Basic text wrapping for notes
      const maxWidth = canvas.width - (margin * 2);
      const words = noteText.split(' ');
      let line = '';
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, margin, currentY);
          line = words[n] + ' ';
          currentY += lineSpacing * 0.8;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, margin, currentY);
    }

    // Draw Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = `black ${fontSize * 1.2}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('TITRIN AGRI-SOIL', canvas.width - margin, img.height + padding - margin);

    const link = document.createElement('a');
    link.download = `${customLabel || photo.label}-${photo.id}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

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
            className="flex items-center gap-2 px-6 py-2 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-105 transition-transform"
          >
            <Save className="w-4 h-4" />
            Finalize & Copy
          </button>
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

                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Notes / Mottling / Roots</label>
                      <textarea 
                        value={pit.notes}
                        onChange={e => updateTestPit(pit.id, 'notes', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all h-20 resize-none"
                        placeholder="Describe soil structure, mottling, root depth, etc."
                      />
                    </div>

                    {/* Test Pit Photo Section */}
                    <div className="md:col-span-3 pt-2">
                      {pit.photo ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                          <img src={pit.photo.url} alt={`Pit ${index + 1}`} className="w-full h-48 object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                              onClick={() => downloadWatermarkedPhoto(pit.photo!, `Test Pit ${index + 1}`, pit.notes)}
                              className="p-3 bg-white text-brand-blue rounded-xl font-bold shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span className="text-xs">Download with Notes</span>
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Drainage Class</label>
                <select 
                  value={observations.drainage}
                  onChange={e => setObservations({...observations, drainage: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all appearance-none"
                >
                  {DRAINAGE_CLASSES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Smell / Odor</label>
                <input 
                  type="text" 
                  value={observations.smell}
                  onChange={e => setObservations({...observations, smell: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-green transition-all"
                  placeholder="e.g. None, Septic, Sulfur"
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
                  placeholder="What did the owner mention?"
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
