import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  FileText,
  ClipboardList,
  Mail,
  Zap,
  Menu,
  X,
  LogOut,
  RefreshCw,
  Edit3,
  Sparkles,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LOGOS } from '../constants';
import { UserRole } from './PinGate';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lastUpdated: string;
  isEditMode: boolean;
  toggleEditMode: () => void;
  onSync: () => void;
  onLogout: () => void;
  backendAvailable?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'saved' | 'offline';
  role?: UserRole | null;
}

export function Layout({
  children,
  activeTab,
  setActiveTab,
  lastUpdated,
  isEditMode,
  toggleEditMode,
  onSync,
  onLogout,
  backendAvailable = false,
  syncStatus = 'idle',
  role = 'admin',
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = role === 'admin';

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview', adminOnly: false },
    { id: 'projects', label: 'Projects', icon: Briefcase, section: 'Overview', adminOnly: false },
    { id: 'invoices', label: 'Invoices', icon: Receipt, section: 'Overview', adminOnly: true },
    { id: 'notes', label: 'Notes for Claude', icon: FileText, section: 'Overview', adminOnly: true },
    { id: 'field', label: 'Field Form', icon: ClipboardList, section: 'Tools', adminOnly: false },
    { id: 'email', label: 'Email Templates', icon: Mail, section: 'Tools', adminOnly: true },
    { id: 'quick', label: 'Quick Update', icon: Zap, section: 'Tools', adminOnly: true },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, section: 'AI', adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => isAdmin || !item.adminOnly);

  const syncIcon = syncStatus === 'syncing' ? Cloud
    : syncStatus === 'saved' ? Check
    : syncStatus === 'offline' ? CloudOff
    : backendAvailable ? Wifi : WifiOff;

  const syncColor = syncStatus === 'saved' ? 'text-green-400'
    : syncStatus === 'offline' ? 'text-red-400'
    : syncStatus === 'syncing' ? 'text-blue-400 animate-pulse'
    : backendAvailable ? 'text-green-400' : 'text-slate-500';

  const sections = ['Overview', 'Tools', 'AI'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-blue border-b-4 border-brand-green h-16 flex items-center justify-between px-4 md:px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src={LOGOS.white} 
              alt="Titrin AgriSoil Solutions" 
              className="h-10 w-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleEditMode}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              isEditMode
                ? "bg-brand-green text-brand-blue"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditMode ? 'Done' : 'Edit'}</span>
          </button>

          <button
            onClick={onSync}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Backend + sync status */}
          <div className="hidden lg:flex items-center gap-2" title={backendAvailable ? 'Backend connected' : 'Backend offline'}>
            {React.createElement(syncIcon, { className: cn('w-4 h-4', syncColor) })}
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              {syncStatus === 'saved' ? 'Saved' : syncStatus === 'syncing' ? 'Saving…' : syncStatus === 'offline' ? 'Offline' : lastUpdated}
            </span>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${isAdmin ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-green/20 text-brand-green'}`}>
            {isAdmin ? '👑 Admin' : '🦺 Field'}
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Edit Mode Banner */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-brand-green text-brand-blue text-center py-1 text-[11px] font-bold uppercase tracking-widest overflow-hidden"
          >
            Edit Mode Active — Changes save automatically
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-brand-blue border-r border-slate-800 shrink-0">
          <div className="flex-1 py-6 overflow-y-auto">
            {sections.map((section) => (
              <div key={section} className="mb-6">
                <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  {section}
                </div>
                <nav className="space-y-1">
                  {navItems
                    .filter((item) => item.section === section)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-4",
                          activeTab === item.id
                            ? "bg-slate-800/50 text-white border-brand-green"
                            : "text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-slate-200"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-brand-green" : "text-slate-500")} />
                        {item.label}
                      </button>
                    ))}
                </nav>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Titrin AgriSoil Solutions Ltd.<br />
              titrinsolutions@gmail.com<br />
              778-885-9771
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-blue border-t-2 border-brand-green flex items-center justify-around h-16 z-40 px-2">
        {navItems.slice(0, isAdmin ? 5 : 3).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-2 transition-colors",
              activeTab === item.id ? "text-brand-green" : "text-slate-500"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-brand-blue z-[70] md:hidden shadow-2xl flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <img 
                  src={LOGOS.white} 
                  alt="Titrin AgriSoil Solutions" 
                  className="h-8 w-auto"
                  referrerPolicy="no-referrer"
                />
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 py-6 overflow-y-auto">
                {sections.map((section) => (
                  <div key={section} className="mb-6">
                    <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {section}
                    </div>
                    <nav className="space-y-1">
                      {navItems
                        .filter((item) => item.section === section)
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-4 px-6 py-4 text-sm font-medium transition-all border-l-4",
                              activeTab === item.id
                                ? "bg-slate-800 text-white border-brand-green"
                                : "text-slate-400 border-transparent hover:bg-slate-800/30"
                            )}
                          >
                            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-brand-green" : "text-slate-500")} />
                            {item.label}
                          </button>
                        ))}
                    </nav>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

