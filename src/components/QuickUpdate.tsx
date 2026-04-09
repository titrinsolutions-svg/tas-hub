import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Send, CheckCircle2, ChevronDown,
  Loader2, Sparkles, Mail, ExternalLink, AlertCircle
} from 'lucide-react';
import { AppData } from '../types';
import { createGmailDraft, generateEmailDraft } from '../lib/api';

interface QuickUpdateProps {
  data: AppData;
  backendAvailable: boolean;
}

type SendStatus = 'idle' | 'generating' | 'sending' | 'done' | 'error';

export function QuickUpdate({ data, backendAvailable }: QuickUpdateProps) {
  const [project, setProject] = useState('');
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SendStatus>('idle');
  const [error, setError] = useState('');
  const [draftLink, setDraftLink] = useState('');
  const [useAI, setUseAI] = useState(true);

  const updateTypes = [
    'Meeting Note',
    'Site Visit',
    'Client Call',
    'Status Change',
    'New Contact',
    'Document Sent',
    'Invoice Sent',
    'Follow-Up',
    'Other',
  ];

  const selectedProject = data.projects.find(p => p.name === project);

  const handleSend = async () => {
    if (!project || !type || !message) {
      setError('Please fill all fields');
      return;
    }
    setError('');

    if (!backendAvailable) {
      // Fallback: mailto
      const subject = `TAS UPDATE: ${project} - ${type}`;
      const body = `${message}\n\n---\nSent from TAS Hub Quick Update`;
      window.location.href = `mailto:titrinsolutions@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('done');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    try {
      let subject = `TAS UPDATE: ${project} - ${type}`;
      let body = message;

      if (useAI) {
        setStatus('generating');
        try {
          const draft = await generateEmailDraft({
            type,
            projectName: project,
            clientName: selectedProject?.client,
            context: message,
          });
          subject = draft.subject || subject;
          body = draft.body || body;
        } catch {
          // AI failed — use raw message
          body = `${message}\n\n---\nSent from TAS Hub`;
        }
      } else {
        body = `${message}\n\n---\nSent from TAS Hub Quick Update`;
      }

      setStatus('sending');
      const result = await createGmailDraft({
        to: 'titrinsolutions@gmail.com',
        subject,
        body,
      });

      setDraftLink(result.link || 'https://mail.google.com/mail/#drafts');
      setStatus('done');

      // Reset after delay
      setTimeout(() => {
        setStatus('idle');
        setProject('');
        setType('');
        setMessage('');
        setDraftLink('');
      }, 8000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const isLoading = status === 'generating' || status === 'sending';

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quick Update</h1>

        {/* Backend status banner */}
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
          backendAvailable
            ? 'text-green-700 bg-green-50 border-green-100'
            : 'text-amber-700 bg-amber-50 border-amber-100'
        }`}>
          <Mail className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed uppercase tracking-widest">
            {backendAvailable
              ? 'Gmail API connected — drafts save directly to Gmail drafts folder'
              : 'Backend offline — will open Gmail via mailto fallback'}
          </p>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="font-black text-white uppercase tracking-widest text-sm">Log an Update</h2>
          </div>
          {backendAvailable && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Draft</span>
              <button
                onClick={() => setUseAI(!useAI)}
                className={`relative w-10 h-6 rounded-full transition-colors ${useAI ? 'bg-amber-500' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${useAI ? 'left-5' : 'left-1'}`} />
              </button>
              <Sparkles className={`w-4 h-4 ${useAI ? 'text-amber-400' : 'text-slate-500'}`} />
            </label>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project</label>
            <div className="relative">
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">Select Project</option>
                {data.projects.map(p => (
                  <option key={p.name} value={p.name}>{p.name} — {p.client}</option>
                ))}
                <option value="General">General / Not Project-Specific</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Update Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Update Type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">Select Type</option>
                {updateTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {useAI && backendAvailable ? 'Notes (AI will draft the full email)' : 'Message'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                useAI && backendAvailable
                  ? 'Key details: what happened, amounts, dates, names, next steps — AI will write the email...'
                  : 'What happened? Key details, amounts, names, next steps...'
              }
              className="w-full h-40 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || status === 'done'}
            className={`w-full py-5 font-black text-lg rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed ${
              status === 'done'
                ? 'bg-green-500 shadow-green-500/20 text-white'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-slate-900 disabled:opacity-60'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {status === 'generating' ? 'AI drafting email…' : 'Saving to Gmail…'}
              </>
            ) : status === 'done' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Draft Saved!
              </>
            ) : (
              <>
                {useAI && backendAvailable ? <Sparkles className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                {useAI && backendAvailable ? 'Draft with AI' : 'Send Update'}
              </>
            )}
          </button>

          {/* Success with link */}
          <AnimatePresence>
            {status === 'done' && draftLink && (
              <motion.a
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                href={draftLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-blue-600 font-bold hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Gmail Drafts
              </motion.a>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}
