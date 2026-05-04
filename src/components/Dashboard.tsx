import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Calendar,
  Eye,
  CheckCircle2,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
  Briefcase,
  TrendingUp,
  Clock,
  ArrowUpRight,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { AppData, UserEdits, WeeklyAction } from '../types';
import { cn } from '../lib/utils';
import { LOGOS } from '../constants';

interface DashboardProps {
  data: AppData;
  userEdits: UserEdits;
  isAdmin: boolean;
  isEditMode: boolean;
  onToggleAction: (id: string | number) => void;
  onDeleteAction: (id: string | number, isCustom: boolean) => void;
  onAddAction: (lane: 'now' | 'week' | 'watching') => void;
  onDeleteUpcoming: (index: number) => void;
  onSync: () => void;
}

export function Dashboard({
  data,
  userEdits,
  isAdmin,
  isEditMode,
  onToggleAction,
  onDeleteAction,
  onAddAction,
  onDeleteUpcoming,
  onSync
}: DashboardProps) {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = clock.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const lanes = [
    { id: 'now', label: 'Do Now', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'week', label: 'This Week', icon: Calendar, color: 'text-brand-gold', bg: 'bg-brand-gold/5' },
    { id: 'watching', label: 'Watching', icon: Eye, color: 'text-brand-green', bg: 'bg-brand-green/5' },
  ] as const;

  const doNowCount = data.weeklyActions.filter(
    a => a.lane === 'now' && !userEdits.completedActions.includes(a.id!)
  ).length;

  const baseStats = [
    { label: 'Active Projects', value: data.projects.length, icon: Briefcase, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
    { label: 'Do Now', value: doNowCount, icon: Clock, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Total Actions', value: data.weeklyActions.length, icon: TrendingUp, color: 'text-brand-green', bg: 'bg-brand-green/5' },
  ];
  const adminStats = [
    { label: 'Outstanding', value: data.stats.outstanding, icon: DollarSign, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
  ];
  const stats = isAdmin ? [...baseStats, ...adminStats] : baseStats;

  // Data filtering happens in useAppData based on role.
  // Admin sees everything; field tech receives pre-stripped data.
  const filteredUpcoming = data.upcoming;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="hidden sm:block p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
            <img 
              src={LOGOS.color} 
              alt="TAS Logo" 
              className="h-16 w-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-brand-blue tracking-tight">{greeting}, Tish</h1>
            <p className="text-slate-500 font-medium">
              Titrin AgriSoil Solutions &nbsp;·&nbsp;
              {clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              &nbsp;·&nbsp;
              {clock.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {stats.map((stat, i) => (
          <motion.div
            key={`stat-${stat.label}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-brand-green/30 transition-all flex items-center gap-4"
          >
            <div className={cn("p-4 rounded-2xl transition-colors", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-black text-brand-blue tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-brand-green transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Triage Lanes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-brand-blue tracking-tight">Weekly Triage</h2>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {userEdits.completedActions.length} Completed
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {lanes.map((lane) => {
              const laneActions = data.weeklyActions.filter(a => a.lane === lane.id);
              const activeActions = laneActions.filter(a => !userEdits.completedActions.includes(a.id!));
              const completedActions = laneActions.filter(a => userEdits.completedActions.includes(a.id!));

              return (
                <section key={lane.id} className={cn("rounded-3xl p-6 border border-slate-100 shadow-sm transition-all", lane.bg)}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-6 rounded-full bg-current", lane.color)} />
                      <h3 className={cn("font-black uppercase tracking-widest text-xs", lane.color)}>{lane.label}</h3>
                      <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 shadow-sm">
                        {activeActions.length}
                      </span>
                    </div>
                    {isEditMode && (
                      <button
                        onClick={() => onAddAction(lane.id)}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {activeActions.length > 0 ? (
                      activeActions.map((action, idx) => (
                        <div key={action.id || `active-${lane.id}-${idx}`} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-brand-green/30">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => onToggleAction(action.id!)}
                              className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center hover:border-brand-green transition-colors shrink-0"
                            >
                              <div className="w-2.5 h-2.5 rounded-sm bg-transparent group-hover:bg-slate-100" />
                            </button>
                            <div>
                              <div className="text-[10px] font-bold text-brand-blue/60 uppercase tracking-wider">
                                {action.project}
                              </div>
                              <div className="text-sm font-bold text-brand-blue">
                                {action.task}
                              </div>
                            </div>
                          </div>
                          {isEditMode && (
                            <button
                              onClick={() => onDeleteAction(action.id!, action.id!.toString().startsWith('ca_'))}
                              className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div key={`empty-${lane.id}`} className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        All clear in {lane.label} ✓
                      </div>
                    )}

                    {completedActions.length > 0 && (
                      <details key={`completed-details-${lane.id}`} className="group mt-4">
                        <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors list-none flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                          {completedActions.length} Completed
                        </summary>
                        <div className="mt-3 space-y-2">
                          {completedActions.map((action, idx) => (
                            <div key={action.id || `completed-${lane.id}-${idx}`} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100 opacity-60">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => onToggleAction(action.id!)}
                                  className="w-5 h-5 rounded-lg bg-brand-green flex items-center justify-center shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </button>
                                <div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-through">
                                    {action.project}
                                  </div>
                                  <div className="text-xs font-medium text-slate-500 line-through">
                                    {action.task}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Upcoming Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-brand-blue">Upcoming</h2>
              </div>
              {/* Upcoming items are added via the Notes/sync flow */}
            </div>
            <div className="space-y-4">
              {filteredUpcoming.length > 0 ? (
                filteredUpcoming.map((item, i) => (
                  <div key={`upcoming-${i}`} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-brand-gold" />
                      <div className="w-px flex-1 bg-slate-100 my-1" />
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-brand-blue leading-tight">
                          {item}
                        </p>
                        {isEditMode && (
                          <button
                            onClick={() => onDeleteUpcoming(i)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div key="upcoming-empty" className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-4">No upcoming events.</div>
              )}
            </div>
          </section>

          {/* Notes for AI — shown only to admin */}
          {isAdmin && (
            <section className="bg-brand-blue rounded-3xl p-6 shadow-xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-xl text-brand-green">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Notes for AI</h2>
              </div>
              {(userEdits.noteJournal?.length ?? 0) > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                  {(userEdits.noteJournal || []).slice(-3).map(n => (
                    <div key={n.id} className="text-xs text-slate-400 bg-slate-900/50 rounded-xl px-3 py-2 line-clamp-2">
                      <span className="font-black text-slate-300 uppercase">{n.author}</span> — {n.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs font-medium mb-4">
                  No journal entries yet. Use the Notes tab to chat with the AI.
                </p>
              )}
              <button
                onClick={onSync}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync to Clipboard
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
