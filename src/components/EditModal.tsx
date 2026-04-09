import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
}

export function EditModal({ isOpen, onClose, title, children, onSave }: EditModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-900 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">{title}</h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {children}
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
