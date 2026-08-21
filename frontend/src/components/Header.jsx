import React from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  BarChart3, 
  RefreshCw, 
  Bot, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

export default function Header({ onReset, onRefresh, onOpenAnalytics, isResetting, isRefreshing }) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                Exception Resolution Workbench
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" /> AI Employee
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Deterministic AP Rules Engine & Managed LLM Governance
            </p>
          </div>
        </div>

        {/* Status Badge & Global Controls */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Policy Engine Online</span>
          </div>

          {/* Analytics Chart Modal Button */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            title="View Exception Distribution & Metrics Charts"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Analytics</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            title="Reload Exceptions Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Reset Baseline Data */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            title="Reset dataset back to initial 10 synthetic exceptions state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo State</span>
          </button>

        </div>

      </div>
    </header>
  );
}
