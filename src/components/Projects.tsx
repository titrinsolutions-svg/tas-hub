import React from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  User,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  MapPin,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { AppData, Project, UserEdits } from '../types';
import { cn } from '../lib/utils';

interface ProjectsProps {
  data: AppData;
  userEdits: UserEdits;
  isEditMode: boolean;
  onAddProject: () => void;
  onEditProject: (index: number, isCustom: boolean) => void;
  onDeleteProject: (name: string) => void;
}

export function Projects({
  data,
  userEdits,
  isEditMode,
  onAddProject,
  onEditProject,
  onDeleteProject
}: ProjectsProps) {
  const badgeStyles: Record<string, string> = {
    fp: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    alc: 'bg-red-50 text-red-700 border-red-100',
    fqa: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    cemp: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    new: 'bg-purple-50 text-purple-700 border-purple-100',
    sfu: 'bg-orange-50 text-orange-700 border-orange-100',
  };

  const statusStyles: Record<string, string> = {
    active: 'bg-brand-green',
    urgent: 'bg-red-500',
    hold: 'bg-brand-gold',
    new: 'bg-brand-blue',
  };

  const sanitizeFinancialInfo = (text: string) => {
    if (!text) return text;
    // Remove sentences or phrases containing $, invoice, payment, retainer, etc.
    return text
      .split(/[.!?]+/)
      .filter(sentence => 
        !sentence.toLowerCase().includes('$') && 
        !sentence.toLowerCase().includes('invoice') && 
        !sentence.toLowerCase().includes('payment') &&
        !sentence.toLowerCase().includes('retainer') &&
        !sentence.toLowerCase().includes('💰')
      )
      .join('. ')
      .trim();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-blue tracking-tight">Project Portfolio</h1>
          <p className="text-slate-500 font-medium">Managing {data.projects.length} active engagements</p>
        </div>
        {isEditMode && (
          <button
            onClick={onAddProject}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-brand-blue/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.projects.map((project, i) => {
          const isCustom = !!project.id;
          return (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:border-brand-green/30 transition-all"
            >
              {/* Card Header */}
              <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-start gap-5">
                  <div className={cn(
                    "mt-1.5 w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.1)]", 
                    statusStyles[project.status] || statusStyles.new
                  )} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-brand-blue leading-tight group-hover:text-brand-green transition-colors">
                        {project.name}
                      </h3>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        badgeStyles[project.badge] || badgeStyles.new
                      )}>
                        {project.badgeLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {project.client}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        BC Region
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditProject(i, isCustom)}
                        className="p-2.5 bg-white text-slate-400 hover:text-brand-blue border border-slate-100 rounded-xl transition-all shadow-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(project.name)}
                        className="p-2.5 bg-white text-slate-400 hover:text-red-600 border border-slate-100 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-brand-blue border border-slate-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-brand-green transition-all shadow-sm">
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Project Overview</h4>
                    <p className="text-base text-slate-600 font-medium leading-relaxed">
                      {sanitizeFinancialInfo(project.note)}
                    </p>
                  </div>

                  {project.action && (
                    <div className={cn(
                      "p-6 rounded-2xl border flex gap-5 items-start transition-all",
                      project.actionType === 'urgent'
                        ? "bg-red-50/50 border-red-100 text-red-700"
                        : "bg-brand-green/5 border-brand-green/10 text-brand-green"
                    )}>
                      <div className={cn(
                        "p-3 rounded-xl shrink-0 shadow-sm",
                        project.actionType === 'urgent' ? "bg-white text-red-500" : "bg-white text-brand-green"
                      )}>
                        {project.actionType === 'urgent' ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">
                          {project.actionType === 'urgent' ? 'Critical Action' : 'Next Milestone'}
                        </div>
                        <p className="text-base font-black leading-snug tracking-tight">
                          {sanitizeFinancialInfo(project.action)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Timeline</span>
                        <span className="text-xs font-black text-brand-blue">Q2 2026</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Soil Type</span>
                        <span className="text-xs font-black text-brand-blue">Sandy Loam</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Risk Level</span>
                        <span className="text-xs font-black text-brand-green">Low</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-4 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-brand-blue/10">
                    Generate Report
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
