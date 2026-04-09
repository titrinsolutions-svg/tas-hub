import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, ArrowRight, HardHat, Crown } from 'lucide-react';
import { LOGOS } from '../constants';

export type UserRole = 'admin' | 'field';

interface PinGateProps {
  onUnlock: (role: UserRole) => void;
}

const PINS: Record<UserRole, string> = {
  admin: '8474',
  field: '8888',
};

export function PinGate({ onUnlock }: PinGateProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = () => {
    if (!selectedRole) return;
    if (pin === PINS[selectedRole]) {
      onUnlock(selectedRole);
    } else {
      setError('Invalid PIN');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-blue z-[9999] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-green rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-gold rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md flex flex-col items-center gap-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-5 bg-white rounded-[2rem] shadow-2xl shadow-black/20">
            <img src={LOGOS.color} alt="TAS Logo" className="h-16 w-auto" referrerPolicy="no-referrer" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">TAS Hub</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Titrin AgriSoil Solutions Ltd.</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            /* Role Selection */
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-3"
            >
              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Select Your Role</p>

              <button
                onClick={() => setSelectedRole('admin')}
                className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/40 rounded-2xl transition-all group"
              >
                <div className="p-2.5 bg-brand-gold/20 rounded-xl">
                  <Crown className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-white font-black text-sm">Admin</div>
                  <div className="text-slate-400 text-xs">Full access — Tish Titina</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setSelectedRole('field')}
                className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-green/40 rounded-2xl transition-all group"
              >
                <div className="p-2.5 bg-brand-green/20 rounded-xl">
                  <HardHat className="w-5 h-5 text-brand-green" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-white font-black text-sm">Field Tech</div>
                  <div className="text-slate-400 text-xs">Site visits & field forms</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
              </button>
            </motion.div>
          ) : (
            /* PIN Entry */
            <motion.div
              key="pin-entry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => { setSelectedRole(null); setPin(''); setError(''); }}
                  className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
                >
                  ← Back
                </button>
                <div className="flex-1 text-center">
                  <span className={`text-xs font-black uppercase tracking-widest ${selectedRole === 'admin' ? 'text-brand-gold' : 'text-brand-green'}`}>
                    {selectedRole === 'admin' ? '👑 Admin Login' : '🦺 Field Tech Login'}
                  </span>
                </div>
              </div>

              <div className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${selectedRole === 'admin' ? 'from-brand-gold to-yellow-300' : 'from-brand-green to-emerald-400'} rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity`} />
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••"
                    value={pin}
                    autoFocus
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    className="w-full py-6 px-8 text-3xl text-center tracking-[1.5em] bg-slate-900/50 border border-white/10 rounded-2xl text-white outline-none focus:border-white/20 transition-all placeholder:text-slate-700 font-mono"
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUnlock}
                className={`w-full py-5 font-black text-lg rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group ${
                  selectedRole === 'admin'
                    ? 'bg-brand-gold hover:bg-yellow-400 text-brand-blue'
                    : 'bg-brand-green hover:bg-emerald-400 text-white'
                }`}
              >
                Authenticate
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-black uppercase tracking-widest"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
          Secure Access Protocol v3.0
        </div>
      </motion.div>
    </div>
  );
}
