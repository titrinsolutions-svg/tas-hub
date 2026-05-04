import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, ArrowRight, HardHat, Crown, Delete } from 'lucide-react';
import { LOGOS } from '../constants';

export type UserRole = 'admin' | 'field';

interface PinGateProps {
  onUnlock: (role: UserRole) => void;
}

// PINs come from build-time env vars so they aren't sitting in plain source.
// Defaults match prior behaviour for first-time setup; override in .env.local.
const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN as string | undefined) || '8474';
const FIELD_PIN = (import.meta.env.VITE_FIELD_PIN as string | undefined) || '8888';

const LOCKOUT_KEY = 'tas_hub_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

function getLockout(): { until: number; attempts: number } {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { until: 0, attempts: 0 };
    return JSON.parse(raw);
  } catch {
    return { until: 0, attempts: 0 };
  }
}

function setLockout(state: { until: number; attempts: number }) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
}

export function PinGate({ onUnlock }: PinGateProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState<number>(() => getLockout().until);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLocked = lockedUntil > now;
  const remainingSeconds = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  const handleUnlock = () => {
    if (!selectedRole || isLocked) return;
    const expected = selectedRole === 'admin' ? ADMIN_PIN : FIELD_PIN;
    if (pin === expected) {
      setLockout({ until: 0, attempts: 0 });
      onUnlock(selectedRole);
      return;
    }

    const state = getLockout();
    const attempts = state.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      setLockout({ until, attempts: 0 });
      setLockedUntil(until);
      setError(`Too many attempts. Locked for ${LOCKOUT_MINUTES} min.`);
    } else {
      setLockout({ until: 0, attempts });
      setError(`Invalid PIN — ${MAX_ATTEMPTS - attempts} attempt(s) left`);
    }
    setPin('');
  };

  const appendDigit = (d: string) => {
    if (isLocked || pin.length >= 8) return;
    setPin(pin + d);
    setError('');
  };

  const backspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
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
                    {selectedRole === 'admin' ? 'Admin Login' : 'Field Tech Login'}
                  </span>
                </div>
              </div>

              {/* PIN dots */}
              <div className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${selectedRole === 'admin' ? 'from-brand-gold to-yellow-300' : 'from-brand-green to-emerald-400'} rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity`} />
                <div className="relative flex items-center justify-center gap-3 py-6 bg-slate-900/50 border border-white/10 rounded-2xl">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                        pin.length > i ? 'bg-white scale-110' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Numeric keypad — better for mobile field use than tiny inputs */}
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => appendDigit(d)}
                    disabled={isLocked}
                    className="py-4 bg-white/5 hover:bg-white/10 active:bg-white/20 disabled:opacity-30 border border-white/10 rounded-xl text-white text-2xl font-black transition-all"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={backspace}
                  disabled={isLocked || pin.length === 0}
                  className="py-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-xl text-slate-400 flex items-center justify-center transition-all"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  onClick={() => appendDigit('0')}
                  disabled={isLocked}
                  className="py-4 bg-white/5 hover:bg-white/10 active:bg-white/20 disabled:opacity-30 border border-white/10 rounded-xl text-white text-2xl font-black transition-all"
                >
                  0
                </button>
                <button
                  onClick={handleUnlock}
                  disabled={isLocked || pin.length < 4}
                  className={`py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    selectedRole === 'admin'
                      ? 'bg-brand-gold hover:bg-yellow-400 text-brand-blue disabled:opacity-30'
                      : 'bg-brand-green hover:bg-emerald-400 text-white disabled:opacity-30'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {(error || isLocked) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-black uppercase tracking-widest"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isLocked ? `Locked — try again in ${remainingSeconds}s` : error}
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
