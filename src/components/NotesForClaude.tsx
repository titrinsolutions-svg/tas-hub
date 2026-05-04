import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, RefreshCw, Trash2, Info, Send, Bot, User as UserIcon,
  CheckCircle2, Circle, Sparkles, Loader2, AlertCircle
} from 'lucide-react';
import { UserEdits, NoteEntry } from '../types';
import { cn } from '../lib/utils';
import { geminiChat, hasDirectGeminiAccess, ChatMessage } from '../lib/api';

interface NotesForClaudeProps {
  userEdits: UserEdits;
  backendAvailable: boolean;
  onJournalChange: (journal: NoteEntry[]) => void;
  onSync: () => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-CA', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function NotesForClaude({ userEdits, backendAvailable, onJournalChange, onSync }: NotesForClaudeProps) {
  const [draft, setDraft] = useState('');
  const [askingAI, setAskingAI] = useState(false);
  const [error, setError] = useState('');

  const journal = useMemo(() => {
    // Migrate legacy free-form notes into a single AI-pending entry on first load
    if (userEdits.noteJournal && userEdits.noteJournal.length > 0) return userEdits.noteJournal;
    if (userEdits.notesForClaude?.trim()) {
      return [{
        id: 'legacy',
        author: 'tish' as const,
        ts: new Date().toISOString(),
        text: userEdits.notesForClaude,
      }];
    }
    return [];
  }, [userEdits.noteJournal, userEdits.notesForClaude]);

  const aiAvailable = backendAvailable || hasDirectGeminiAccess();

  const post = (text: string, author: NoteEntry['author']) => {
    if (!text.trim()) return;
    const entry: NoteEntry = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      author,
      ts: new Date().toISOString(),
      text: text.trim(),
    };
    onJournalChange([...journal, entry]);
  };

  const submitNote = () => {
    if (!draft.trim()) return;
    post(draft, 'tish');
    setDraft('');
  };

  const askAI = async () => {
    if (!draft.trim() || askingAI) return;
    if (!aiAvailable) {
      setError('AI not available — start the backend or set VITE_GEMINI_API_KEY');
      setTimeout(() => setError(''), 4000);
      return;
    }
    const question = draft.trim();
    post(question, 'tish');
    setDraft('');
    setAskingAI(true);
    setError('');

    try {
      const history: ChatMessage[] = journal.slice(-6).map(n => ({
        role: n.author === 'ai' ? 'model' : 'user',
        content: n.text,
      }));
      const reply = await geminiChat(question, history);
      post(reply, 'ai');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setAskingAI(false);
    }
  };

  const toggleResolved = (id: string) => {
    onJournalChange(journal.map(n => n.id === id ? { ...n, resolved: !n.resolved } : n));
  };

  const remove = (id: string) => {
    onJournalChange(journal.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (!confirm('Clear the entire note journal? This cannot be undone.')) return;
    onJournalChange([]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-brand-blue tracking-tight">Notes for AI</h1>
        <p className="text-sm font-medium text-slate-500">
          Two-way journal between you and the AI. Drop instructions, ask questions, get answers, mark items resolved.
        </p>
      </div>

      {/* Journal */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-brand-blue" />
            <h2 className="font-black text-brand-blue uppercase tracking-widest text-xs">Journal</h2>
            <span className="text-[10px] font-bold text-slate-400">{journal.length} entries</span>
          </div>
          {journal.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-50 max-h-[55vh] overflow-y-auto">
          <AnimatePresence initial={false}>
            {journal.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                No notes yet — write something below to get started
              </div>
            )}
            {journal.map((entry) => {
              const isAI = entry.author === 'ai';
              const isField = entry.author === 'field';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'group px-5 py-4 flex gap-3 hover:bg-slate-50/50 transition-colors',
                    entry.resolved && 'opacity-50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    isAI ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                    isField ? 'bg-brand-green' : 'bg-brand-blue'
                  )}>
                    {isAI ? <Bot className="w-4 h-4 text-white" /> : <UserIcon className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                        {isAI ? 'AI' : isField ? 'Field Tech' : 'Tish'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{formatTime(entry.ts)}</span>
                      {entry.resolved && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-sm leading-relaxed whitespace-pre-wrap break-words',
                      entry.resolved ? 'line-through text-slate-400' : 'text-slate-700'
                    )}>
                      {entry.text}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleResolved(entry.id)}
                      className="p-1.5 text-slate-300 hover:text-brand-green transition-colors"
                      title={entry.resolved ? 'Unresolve' : 'Mark resolved'}
                    >
                      {entry.resolved ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => remove(entry.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submitNote();
              }
            }}
            placeholder="Leave a note, paste an update, or ask the AI a question…"
            className="w-full h-24 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Info className="w-3 h-3" />
              {aiAvailable ? 'Cmd/Ctrl+Enter to post' : 'AI offline'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSync}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-brand-blue text-slate-700 hover:text-brand-blue font-bold rounded-xl transition-all text-xs"
                title="Copy journal to clipboard"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </button>
              <button
                onClick={submitNote}
                disabled={!draft.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-xs shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Post Note
              </button>
              <button
                onClick={askAI}
                disabled={!draft.trim() || askingAI || !aiAvailable}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-xs shadow-sm"
              >
                {askingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Ask AI
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
