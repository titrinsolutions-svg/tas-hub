import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Copy, Check, Info } from 'lucide-react';
import { AppData, EmailTemplate } from '../types';
import { cn } from '../lib/utils';

interface EmailTemplatesProps {
  data: AppData;
}

export function EmailTemplates({ data }: EmailTemplatesProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email Templates</h1>
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 w-fit">
          <Info className="w-4 h-4" />
          <p className="text-xs font-bold uppercase tracking-widest">Tip: Fill fields, copy body, paste into Gmail.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.emailTemplates.map((template, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-white uppercase tracking-widest text-xs">{template.title}</h3>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                {template.tag}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</label>
                  <input
                    type="text"
                    placeholder={template.toPlaceholder}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                  <input
                    type="text"
                    placeholder={template.subjectPlaceholder}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Body</label>
                <div className="relative group">
                  <textarea
                    readOnly
                    value={template.body}
                    className="w-full h-64 px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 leading-relaxed resize-none outline-none"
                  />
                  <button
                    onClick={() => handleCopy(template.body, i)}
                    className={cn(
                      "absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                      copiedIndex === i
                        ? "bg-green-500 text-white"
                        : "bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Body
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
