import React from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';

export default function MetricsBar({ metrics }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl animate-pulse h-24 bg-slate-800/40" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Exceptions',
      value: metrics.total_exceptions || 0,
      subtext: 'Synthetic AP Queue',
      icon: FileCheck2,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
      iconBg: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: 'High Risk Items',
      value: metrics.high_risk_count || 0,
      subtext: `Requires Audit (${metrics.high_risk_count} total)`,
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400',
    },
    {
      title: 'Pending Queue',
      value: metrics.pending_count || 0,
      subtext: 'Awaiting Action',
      icon: Clock,
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
    {
      title: 'Auto-Resolved',
      value: metrics.auto_resolved_count || 0,
      subtext: '≥90% Confidence Rules',
      icon: Zap,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      title: 'Resolution Rate',
      value: `${metrics.resolution_rate_pct || 0}%`,
      subtext: `${(metrics.auto_resolved_count || 0) + (metrics.manually_resolved_count || 0)} of ${metrics.total_exceptions || 0} Resolved`,
      icon: TrendingUp,
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-4 rounded-xl border bg-gradient-to-br ${card.color} transition-all duration-300 hover:scale-[1.02] shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
