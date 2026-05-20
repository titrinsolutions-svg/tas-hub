import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, Camera, CheckCircle2, X, Link2, Loader2, RefreshCw } from 'lucide-react';
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
    s.testPits && Array.isArray(s.testPits) && s.testPits.length > 0 && `Test pits: ${s.testPits.length}`,
    s.photoCount && `Photos: ${s.photoCount}`,
    s.observations,
  ].filter(Boolean);
  return lines.join('\n');
}

export function FieldSubmissions({ data, userEdits, onAttachToProject, backendAvailable }: FieldSubmissionsProps) {
  const [submissions, setSubmissions] = useState<FieldSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Record<string, string>>({});

  const refresh = async () => {
    if (!backendAvailable) return;
    setLoading(true);
    const items = await listFieldSubmissions('pending');
    setSubmissions(items);
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
