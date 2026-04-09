import React from 'react';
import { motion } from 'motion/react';
import { FileText, RefreshCw, Trash2, Info, Lightbulb } from 'lucide-react';
import { UserEdits } from '../types';
import { cn } from '../lib/utils';

interface NotesForClaudeProps {
  userEdits: UserEdits;
  onNotesChange: (notes: string) => void;
  onSync: () => void;
  onClear: () => void;
}

export function NotesForClaude({ userEdits, onNotesChange, onSync, onClear }: NotesForClaudeProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notes for Claude</h1>
        <p className="text-sm font-medium text-slate-500">
          Leave instructions, corrections, or updates for the next hub refresh.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 rounded-3xl border border-amber-200 shadow-xl shadow-amber-200/20 overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-700" />
            <h2 className="font-black text-amber-900 uppercase tracking-widest text-sm">Claude's Inbox</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClear}
              className="p-2 text-amber-700/50 hover:text-red-600 transition-colors"
              title="Clear Notes"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <textarea
            value={userEdits.notesForClaude}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Examples:&#10;• Terrablue payment received Mar 21 — $5,250, start work now&#10;• Invoice #26032001 paid by Wes Mader Mar 22&#10;• Kush / Finn Road project is on hold indefinitely&#10;• New project: 99999 Example St, Richmond — Peter Zhang, Farm Plan"
            className="w-full h-96 bg-transparent border-none focus:ring-0 text-base font-medium text-amber-900 placeholder-amber-400/60 resize-none leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200">
            <div className="flex items-center gap-2 text-amber-700/60">
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Saves automatically to browser</span>
            </div>
            <button
              onClick={onSync}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              <RefreshCw className="w-5 h-5" />
              Sync to Claude
            </button>
          </div>
        </div>
      </motion.section>

      <section className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
        <div className="flex items-center gap-3 text-blue-600">
          <Lightbulb className="w-6 h-6" />
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">How this works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-slate-600 font-medium">
          <div className="space-y-4">
            <p>
              <strong className="text-slate-900">1. You edit the hub</strong><br />
              Use <span className="text-amber-600 font-bold">Edit Mode</span> to directly modify projects, actions, and invoices.
            </p>
            <p>
              <strong className="text-slate-900">2. Leave notes above</strong><br />
              For things that are harder to edit in place, like complex payment updates or new project instructions.
            </p>
          </div>
          <div className="space-y-4">
            <p>
              <strong className="text-slate-900">3. Sync to Claude</strong><br />
              Click the sync button to copy your changes. Paste them into a Claude message.
            </p>
            <p>
              <strong className="text-slate-900">4. Claude updates the data</strong><br />
              I'll read your notes and edits, update the core data, and push a refreshed hub back to you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
