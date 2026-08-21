import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  Layers 
} from 'lucide-react';

export default function ExceptionQueue({ exceptions, selectedId, onSelectException, activeSeverity, onChangeSeverity, activeStatus, onChangeStatus }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExceptions = exceptions.filter((item) => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exception_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = activeSeverity === 'ALL' || item.severity === activeSeverity;
    const matchesStatus = activeStatus === 'ALL' || item.status === activeStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AUTO_RESOLVED':
        return { text: 'AUTO RESOLVED', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40', icon: Zap };
      case 'RESOLVED':
        return { text: 'RESOLVED', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/40', icon: CheckCircle2 };
      case 'ESCALATED':
        return { text: 'ESCALATED', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/40', icon: ShieldAlert };
      default:
        return { text: 'PENDING', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/40', icon: AlertCircle };
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 0.70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[calc(100vh-210px)] min-h-[600px] overflow-hidden shadow-xl">
      
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Exception Queue ({filteredExceptions.length})
            </h2>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Click item to inspect
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, Vendor, PO, or Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="space-y-2 pt-1">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-400 font-semibold text-[10px] uppercase mr-1">Risk:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => onChangeSeverity(sev)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeSeverity === sev
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-slate-400 font-semibold text-[10px] uppercase mr-1">Status:</span>
            {['ALL', 'PENDING', 'AUTO_RESOLVED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => onChangeStatus(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exception List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y-0">
        {filteredExceptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No exceptions match your filter criteria.
          </div>
        ) : (
          filteredExceptions.map((item) => {
            const isSelected = item.id === selectedId;
            const statusInfo = getStatusBadge(item.status);
            const StatusIcon = statusInfo.icon;
            const confidencePct = Math.round(item.confidence_score * 100);

            return (
              <div
                key={item.id}
                onClick={() => onSelectException(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />
                )}

                {/* Top Row: Exception ID & Vendor */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white">
                      {item.id}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.bg}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.text}
                  </span>
                </div>

                {/* Vendor Name */}
                <div className="text-xs font-semibold text-slate-200 mb-2 truncate">
                  {item.vendor}
                </div>

                {/* Exception Type */}
                <div className="text-[11px] text-slate-400 font-mono mb-2 flex items-center gap-1">
                  <span className="text-indigo-400">●</span> {item.exception_type.replace(/_/g, ' ')}
                </div>

                {/* Amounts & Variance */}
                <div className="flex items-center justify-between bg-slate-950/60 rounded-lg p-2 border border-slate-800/60 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Invoice</div>
                    <div className="font-semibold text-slate-200">${item.invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Variance</div>
                    <div className={`font-bold ${item.variance_amount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {item.variance_amount > 0 ? `+$${item.variance_amount.toLocaleString()}` : `$${item.variance_amount}`}
                      <span className="text-[10px] ml-1 font-normal opacity-80">({item.variance_pct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: AI Confidence Meter */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/40 text-[11px]">
                  <span className="text-slate-400 text-[10px]">AI Policy Target:</span>
                  <div className={`px-2 py-0.5 rounded border text-[10px] font-bold font-mono flex items-center gap-1 ${getConfidenceColor(item.confidence_score)}`}>
                    <span>{confidencePct}% Conf</span>
                    <span className="opacity-60">• {item.policy_action}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
