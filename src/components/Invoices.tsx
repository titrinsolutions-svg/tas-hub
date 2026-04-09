import React from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Receipt,
  ArrowUpRight,
  Filter,
  Download,
  CreditCard
} from 'lucide-react';
import { AppData, Invoice, UserEdits } from '../types';
import { cn } from '../lib/utils';

interface InvoicesProps {
  data: AppData;
  userEdits: UserEdits;
  isEditMode: boolean;
  onAddInvoice: () => void;
  onMarkPaid: (num: string) => void;
  onDeleteInvoice: (num: string) => void;
}

export function Invoices({
  data,
  userEdits,
  isEditMode,
  onAddInvoice,
  onMarkPaid,
  onDeleteInvoice
}: InvoicesProps) {
  const moneyTypeStyles: Record<string, string> = {
    exp: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    cash: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    needed: 'bg-red-50 text-red-700 border-red-100',
    done: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const moneyTypeLabels: Record<string, string> = {
    exp: 'Expected',
    cash: 'Cash',
    needed: 'Invoice Now!',
    done: 'Paid ✅',
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-blue tracking-tight">Financial Hub</h1>
          <p className="text-slate-500 font-medium tracking-tight">Revenue tracking & invoice management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-blue transition-all shadow-sm">
            <Download className="w-5 h-5" />
          </button>
          {isEditMode && (
            <button
              onClick={onAddInvoice}
              className="flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-brand-blue/20"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Outstanding', value: data.invoices.totals.outstanding, icon: Clock, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
          { label: 'Paid (2026)', value: data.invoices.totals.paidConfirmed, icon: CheckCircle2, color: 'text-brand-green', bg: 'bg-brand-green/10' },
          { label: 'Unmatched', value: data.invoices.totals.unmatchedReceipts, icon: AlertCircle, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
          { label: 'Total Revenue', value: data.invoices.totals.totalInvoiced2026, icon: TrendingUp, color: 'text-brand-blue', bg: 'bg-brand-blue/10', highlight: true },
        ].map((stat, i) => (
          <motion.div
            key={`invoice-stat-${stat.label}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-6 rounded-3xl border shadow-sm flex flex-col justify-between gap-4",
              stat.highlight ? "bg-brand-blue border-brand-blue text-white" : "bg-white border-slate-100 text-brand-blue"
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-2.5 rounded-xl", stat.highlight ? "bg-white/10 text-white" : stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className={cn("w-4 h-4", stat.highlight ? "text-white/40" : "text-slate-200")} />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight font-mono">{stat.value}</div>
              <div className={cn("text-[10px] font-bold uppercase tracking-widest", stat.highlight ? "text-white/60" : "text-slate-400")}>
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Money Tracker Card */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-brand-green flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <h2 className="font-black text-white uppercase tracking-widest text-xs">Cash Flow Pipeline</h2>
              </div>
              <CreditCard className="w-4 h-4 text-white/40" />
            </div>
            <div className="divide-y divide-slate-50">
              <div className="px-6 py-3 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Incoming / Expected
              </div>
              {data.moneyTracker.incoming.map((item, i) => (
                <div key={`incoming-${i}`} className={cn("px-6 py-4 flex items-center justify-between gap-4 group hover:bg-slate-50 transition-colors", item.type === 'done' && "opacity-50")}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-brand-blue truncate">{item.label}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", moneyTypeStyles[item.type])}>
                        {moneyTypeLabels[item.type]}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.when}</div>
                  </div>
                  <div className={cn(
                    "text-sm font-black font-mono shrink-0",
                    item.type === 'done' ? "text-slate-300" : item.type === 'needed' ? "text-red-500" : "text-brand-green"
                  )}>
                    {item.amount}
                  </div>
                </div>
              ))}

              <div className="px-6 py-3 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Active Outstanding
              </div>
              {data.moneyTracker.outstanding.map((item, i) => (
                <div key={`outstanding-${i}`} className="px-6 py-4 flex items-center justify-between gap-4 group hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-brand-blue truncate mb-1">{item.label}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.inv}</div>
                  </div>
                  <div className="text-sm font-black font-mono text-brand-gold shrink-0">
                    {item.amount}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Unmatched Warning */}
          {data.invoices.unmatched.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-brand-gold/5 border border-brand-gold/20 rounded-3xl p-6 flex items-start gap-4 shadow-sm"
            >
              <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
                <AlertCircle className="w-5 h-5 shrink-0" />
              </div>
              <div className="text-sm">
                <p className="font-black text-brand-gold uppercase tracking-widest text-xs mb-3">
                  {data.invoices.unmatched.length} Unmatched Payments
                </p>
                <div className="space-y-2">
                  {data.invoices.unmatched.map((u, i) => (
                    <div key={`unmatched-inv-${i}`} className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-white/50 p-2 rounded-lg border border-brand-gold/10">
                      <span>{u.from}</span>
                      <span className="text-brand-gold">{u.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Invoices Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Outstanding Invoices Table */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="font-black text-brand-blue uppercase tracking-widest text-xs">Outstanding Invoices</h2>
              </div>
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-brand-blue transition-colors">
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="px-8 py-4">Invoice #</th>
                    <th className="px-8 py-4">Client / Project</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                    {isEditMode && <th className="px-8 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.invoices.outstanding.map((inv) => (
                    <tr key={inv.num} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-xs font-black font-mono text-brand-blue">#{inv.num}</td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-600">{inv.client}</td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{inv.issued}</td>
                      <td className="px-8 py-5 text-xs font-black text-brand-blue">{inv.amount}</td>
                      <td className="px-8 py-5">
                        <span className="px-2.5 py-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Pending
                        </span>
                      </td>
                      {isEditMode && (
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onMarkPaid(inv.num)}
                              className="p-2 bg-white text-slate-400 hover:text-brand-green border border-slate-100 rounded-xl transition-all shadow-sm"
                              title="Mark as Paid"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteInvoice(inv.num)}
                              className="p-2 bg-white text-slate-400 hover:text-red-600 border border-slate-100 rounded-xl transition-all shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Paid Invoices Table */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
              <div className="p-2 bg-brand-green/10 rounded-xl text-brand-green">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="font-black text-brand-blue uppercase tracking-widest text-xs">Paid History (2026)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="px-8 py-4">Invoice #</th>
                    <th className="px-8 py-4">Client / Project</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                    {isEditMode && <th className="px-8 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.invoices.paid.map((inv) => (
                    <tr key={inv.num} className="opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all group">
                      <td className="px-8 py-5 text-xs font-black font-mono text-slate-400 group-hover:text-brand-blue transition-colors">#{inv.num}</td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">{inv.client}</td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-300 uppercase tracking-widest">{inv.issued}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-500 group-hover:text-brand-blue transition-colors">{inv.amount}</td>
                      <td className="px-8 py-5">
                        <span className="px-2.5 py-1 bg-brand-green/5 text-brand-green border border-brand-green/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Settled
                        </span>
                      </td>
                      {isEditMode && (
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => onDeleteInvoice(inv.num)}
                            className="p-2 bg-white text-slate-300 hover:text-red-600 border border-slate-100 rounded-xl transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
