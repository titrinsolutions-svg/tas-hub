import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, Camera, CheckCircle2, X, Link2, Loader2, RefreshCw, Terminal, Layers, Droplets, AlertTriangle } from 'lucide-react';
import { listFieldSubmissions, updateFieldSubmission, type FieldSubmission } from '../lib/api';
import { AppData, Project, UserEdits } from '../types';
import { cn } from '../lib/utils';

interface FieldSubmissionsProps {
  data: AppData;
  userEdits: UserEdits;
  onAttachToProject: (projectName: string, summary: string) => void;
  backendAvailable: boolean;
}

function summarizeSubmission(s: FieldSubmission): string {
  const lines = [
    `📋 Field submission ${s.submittedAt.slice(0, 10)} by ${s.submittedBy}`,
    `Site: ${s.siteAddress}`,
    s.gps && `GPS: ${s.gps.lat.toFixed(5)}, ${s.gps.lng.toFixed(5)}`,
    s.pits?.length && `Test pits: ${s.pits.length}`,
    !s.pits?.length && s.testPits && Array.isArray(s.testPits) && s.testPits.length > 0 && `Test pits: ${s.testPits.length}`,
    s.photoCount && `Photos: ${s.photoCount}`,
    s.observations,
  ].filter(Boolean);
  return lines.join('\n');
}

function buildCoworkPrompt(s: FieldSubmission): string {
  const base = 'https://tas-hub-titrin.netlify.app/api/field-submissions';
  return `Analyze TAS Hub field submission ${s.id}.

Site: ${s.siteAddress}${s.projectName ? `\nProject: ${s.projectName}` : ''}
Pull full submission: GET ${base}?id=${s.id}
  (use the same x-api-key as the hub frontend; same Netlify Blobs back-end)

Run the full LCA P-10 pipeline using Opus 4.7:
1. Hydrate property context with property_research.py (PMBC, ALR, BC Soil Survey)
2. SIFT manual lookup — confirm/revise the provincial soil mapping for the parcel coordinates
3. Climate normals — nearest active Env Canada station, 1991-2020 normals
4. Prior reports — search TAS Reference Library + Gmail for prior agrology reports on this PID/address
5. Deep photo analysis (per pit profile photo) — horizon detection, Munsell, mottling first-depth, gleying depth, CF%, structure, consistence, rooting depth, drainage class derivation
6. Cross-reference photo evidence with SIFT + prior reports (reconcile per report-lessons.md May 14)
7. Build the soil-pit table + climate table + drainage register
8. Draft the LCA report using tas-report-writer skill, ALC P-10 spec
9. Flag any drainage prediction-verb violations before finalizing

Stop and ask Tish before sealing.`;
}

export function FieldSubmissions({ data, userEdits, onAttachToProject, backendAvailable }: FieldSubmissionsProps) {
  const [submissions, setSubmissions] = useState<FieldSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = async () => {
    if (!backendAvailable) return;
    setLoading(true);
    const items = await listFieldSubmissions('pending');
    setSubmissions(items);
    // Pre-fill the project dropdown when the field tech tagged a project at submission time
    const presets: Record<string, string> = {};
    for (const s of items) {
      if (s.projectName && data.projects.some(p => p.name === s.projectName)) {
        presets[s.id] = s.projectName;
      }
    }
    if (Object.keys(presets).length > 0) {
      setSelectedProject(prev => ({ ...presets, ...prev }));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [backendAvailable]);

  const handleAttach = async (s: FieldSubmission) => {
    const projectName = selectedProject[s.id];
    if (!projectName) return;
    setAttachingId(s.id);
    const summary = summarizeSubmission(s);
    onAttachToProject(projectName, summary);
    await updateFieldSubmission(s.id, { status: 'attached', projectName });
    setSubmissions(prev => prev.filter(x => x.id !== s.id));
    setAttachingId(null);
  };

  const handleDiscard = async (s: FieldSubmission) => {
    if (!confirm(`Discard the field submission for ${s.siteAddress}? This cannot be undone.`)) return;
    setAttachingId(s.id);
    await updateFieldSubmission(s.id, { status: 'discarded' });
    setSubmissions(prev => prev.filter(x => x.id !== s.id));
    setAttachingId(null);
  };

  if (!backendAvailable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <p className="text-sm font-medium text-amber-900">
          Field submissions sync needs the backend. Currently offline — field techs are saving locally only.
        </p>
      </div>
    );
  }

  if (submissions.length === 0 && !loading) {
    return null;
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-brand-blue">Field Submissions</h2>
            <p className="text-xs font-medium text-slate-500">
              {submissions.length} pending — review and attach to a project
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-brand-blue transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {submissions.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="border border-slate-200 rounded-2xl p-4 hover:border-brand-blue/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{s.siteAddress}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.submittedAt).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span>by {s.submittedBy}</span>
                    {s.gps && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {s.gps.lat.toFixed(4)}, {s.gps.lng.toFixed(4)}
                      </span>
                    )}
                    {s.photoCount ? (
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {s.photoCount}
                      </span>
                    ) : null}
                    {Array.isArray(s.testPits) && s.testPits.length > 0 && (
                      <span>{s.testPits.length} test pit{s.testPits.length === 1 ? '' : 's'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* P-10 raw evidence summary (new structured fields) */}
              {(s.pits || s.site) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                  {s.pits && s.pits.length > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200/40 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Layers className="w-3 h-3 text-amber-700" />
                        <span className="font-black text-amber-900 uppercase tracking-widest text-[10px]">Pit evidence ({s.pits.length})</span>
                      </div>
                      <ul className="space-y-1 text-slate-700">
                        {s.pits.slice(0, 4).map((p: any, i: number) => (
                          <li key={p.id ?? i} className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <span className="font-bold text-amber-900">TP{p.pitNumber ?? i + 1}</span>
                            {p.pitBaseDepthCm != null && <span>base {p.pitBaseDepthCm}cm</span>}
                            {p.waterTablePresent && (
                              <span className="flex items-center gap-0.5 text-blue-700">
                                <Droplets className="w-3 h-3" />
                                {p.waterTableDepthCm != null ? `${p.waterTableDepthCm}cm` : 'present'}
                              </span>
                            )}
                            {p.rootingDepthCm != null && <span>roots {p.rootingDepthCm}cm</span>}
                            {p.hoursSinceLastRain != null && p.hoursSinceLastRain < 72 && (
                              <span className="flex items-center gap-0.5 text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                rain {p.hoursSinceLastRain}h ago
                              </span>
                            )}
                          </li>
                        ))}
                        {s.pits.length > 4 && (
                          <li className="text-slate-400 italic">…{s.pits.length - 4} more pit{s.pits.length - 4 === 1 ? '' : 's'}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {s.site && (() => {
                    const site: any = s.site;
                    const bits = [
                      site.assessmentAreaHa && `Area ${site.assessmentAreaHa} ha`,
                      site.currentLandUse && `Use: ${site.currentLandUse}`,
                      site.vegetation && `Veg: ${site.vegetation}`,
                      site.slopeAspect && site.slopeGradient && `Slope ${site.slopeGradient} → ${site.slopeAspect}`,
                      site.pondingEvidence && '⚠ ponding',
                    ].filter(Boolean);
                    if (bits.length === 0) return null;
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <MapPin className="w-3 h-3 text-slate-600" />
                          <span className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Site context</span>
                        </div>
                        <ul className="space-y-0.5 text-slate-700">
                          {bits.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}

              {s.observations && (
                <p className="text-sm text-slate-700 mb-3 whitespace-pre-line bg-slate-50 rounded-xl p-3 leading-relaxed">
                  {s.observations}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedProject[s.id] || ''}
                  onChange={(e) => setSelectedProject(prev => ({ ...prev, [s.id]: e.target.value }))}
                  className="flex-1 min-w-[200px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-brand-blue"
                >
                  <option value="">Attach to project…</option>
                  {data.projects.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAttach(s)}
                  disabled={!selectedProject[s.id] || attachingId === s.id}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                    selectedProject[s.id]
                      ? "bg-brand-blue text-white hover:bg-brand-blue/90"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {attachingId === s.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                  Attach
                </button>
                <button
                  onClick={async () => {
                    const prompt = buildCoworkPrompt(s);
                    try {
                      await navigator.clipboard.writeText(prompt);
                      setCopiedId(s.id);
                      setTimeout(() => setCopiedId(null), 2500);
                    } catch {
                      // Older browser fallback
                      const ta = document.createElement('textarea');
                      ta.value = prompt;
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                      setCopiedId(s.id);
                      setTimeout(() => setCopiedId(null), 2500);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors"
                  title="Copy a prompt to paste into Claude Cowork on desktop"
                >
                  {copiedId === s.id ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Copied</>
                  ) : (
                    <><Terminal className="w-3.5 h-3.5" /> Send to Cowork</>
                  )}
                </button>
                <button
                  onClick={() => handleDiscard(s)}
                  disabled={attachingId === s.id}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-red-600 text-sm font-bold transition-colors"
                  title="Discard this submission"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
