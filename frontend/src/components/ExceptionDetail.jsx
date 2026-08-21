import React, { useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  UserCheck, 
  Info, 
  Clock, 
  ListChecks, 
  DollarSign, 
  ShieldCheck, 
  XCircle 
} from 'lucide-react';

export default function ExceptionDetail({ 
  exception, 
  onExplain, 
  onSuggestResolution, 
  onAutoResolve, 
  onResolve, 
  explanationData, 
  suggestionData, 
  isLoadingAI, 
  actionError, 
  clearActionError 
}) {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [policyErrorModal, setPolicyErrorModal] = useState(null);

  if (!exception) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center h-[calc(100vh-210px)] min-h-[600px] flex flex-col items-center justify-center">
        <Bot className="w-12 h-12 text-slate-600 mb-3 animate-bounce" />
        <h3 className="text-base font-semibold text-slate-300">No Exception Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select an item from the left queue to view details, evaluate policy thresholds, and interact with the AI Employee.
        </p>
      </div>
    );
  }

  const confidencePct = Math.round(exception.confidence_score * 100);
  const isAutoResolveEligible = exception.confidence_score >= 0.90 && exception.policy_action === 'AUTO_RESOLVE';
  const isResolved = exception.status === 'RESOLVED' || exception.status === 'AUTO_RESOLVED';

  const handleAutoResolveClick = async () => {
    if (!isAutoResolveEligible && exception.status === 'PENDING') {
      setPolicyErrorModal(
        `Policy Violation Guardrail Blocked:\nException '${exception.id}' confidence is ${confidencePct}% (below the 90% auto-resolution policy threshold).\n\nCurrent Policy Action: ${exception.policy_action}.\nHuman reviewer sign-off is mandatory.`
      );
      return;
    }
    await onAutoResolve(exception.id);
  };

  const handleHumanResolveSubmit = (e) => {
    e.preventDefault();
    onResolve(exception.id, resolutionNotes || 'Manually approved by human reviewer');
    setShowNotesModal(false);
    setResolutionNotes('');
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[calc(100vh-210px)] min-h-[600px] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight font-mono">
              {exception.id}
            </h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase ${
              exception.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
              exception.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {exception.severity} RISK
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase flex items-center gap-1.5 ${
              exception.status === 'AUTO_RESOLVED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
              exception.status === 'RESOLVED' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
              'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {exception.status === 'AUTO_RESOLVED' && <Zap className="w-3.5 h-3.5" />}
              {exception.status === 'RESOLVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {exception.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
              {exception.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Vendor: <span className="text-indigo-400">{exception.vendor}</span>
          </p>
        </div>

        {/* Action Controls Toolbar */}
        {!isResolved && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto Resolve Button */}
            <button
              onClick={handleAutoResolveClick}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
                isAutoResolveEligible
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white glow-emerald'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/50 hover:text-amber-300'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Auto-Resolve</span>
              {!isAutoResolveEligible && <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/20 font-mono">Policy Guarded</span>}
            </button>

            {/* Human Approve Button */}
            <button
              onClick={() => setShowNotesModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Resolve</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={clearActionError} className="text-rose-400 hover:text-rose-200">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Financial Comparison Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-3.5 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Purchase Order</span>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{exception.po_number}</div>
          <div className="text-base font-extrabold text-slate-100 mt-1">${exception.expected_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="glass-card p-3.5 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Invoice Number</span>
          <div className="text-sm font-bold text-slate-200 mt-0.5">{exception.invoice_number}</div>
          <div className="text-base font-extrabold text-white mt-1">${exception.invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="glass-card p-3.5 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Net Variance</span>
          <div className={`text-base font-extrabold mt-2 ${exception.variance_amount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {exception.variance_amount > 0 ? `+$${exception.variance_amount.toLocaleString()}` : `$${exception.variance_amount}`}
          </div>
          <div className="text-[11px] font-semibold text-slate-400">({exception.variance_pct}% deviation)</div>
        </div>

        <div className="glass-card p-3.5 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Exception Category</span>
          <div className="text-xs font-bold text-indigo-400 mt-1 uppercase font-mono">
            {exception.exception_type.replace(/_/g, ' ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ingested: {new Date(exception.created_at).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Deterministic Policy & Confidence Engine Card */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Deterministic Policy Engine & AI Confidence
            </h3>
          </div>
          <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded border ${
            confidencePct >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            confidencePct >= 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
            'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            Score: {confidencePct}%
          </span>
        </div>

        {/* Confidence Meter Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            {/* 70% Marker */}
            <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-amber-500/80 z-10" title="70% Suggestion Threshold" />
            {/* 90% Marker */}
            <div className="absolute left-[90%] top-0 bottom-0 w-0.5 bg-emerald-500/80 z-10" title="90% Auto-Resolve Threshold" />

            <div
              className={`h-full rounded-full transition-all duration-700 ${
                confidencePct >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                confidencePct >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          
          {/* Threshold Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
            <span>0% Human Audit</span>
            <span className="text-amber-400">70% Suggest Target</span>
            <span className="text-emerald-400">90% Auto-Resolve Target</span>
          </div>
        </div>

        {/* Policy Guardrail Notice Banner */}
        <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
          isAutoResolveEligible
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : exception.confidence_score >= 0.70
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">
              Policy Status: {exception.policy_action}
            </span>
            <p className="text-[11px] opacity-90">
              {isAutoResolveEligible
                ? `Confidence score (${confidencePct}%) satisfies auto-resolution rule (≥90%). Automated 1-click execution is enabled.`
                : exception.confidence_score >= 0.70
                ? `Confidence score (${confidencePct}%) is in suggestion range (70-89%). Auto-resolution is blocked by deterministic policy; human approval required.`
                : `Confidence score (${confidencePct}%) is low (<70%). Requires manual audit.`}
            </p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Line Item Discrepancy Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {exception.line_items?.length || 0} Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">Item SKU</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">PO Qty vs Inv Qty</th>
                <th className="py-2.5 px-3 text-right">PO Rate</th>
                <th className="py-2.5 px-3 text-right">Inv Rate</th>
                <th className="py-2.5 px-3 text-right">PO Total</th>
                <th className="py-2.5 px-3 text-right">Inv Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {exception.line_items?.map((item, idx) => {
                const qtyMismatch = item.qty_po !== item.qty_inv;
                const priceMismatch = item.unit_price_po !== item.unit_price_inv;

                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-indigo-400 font-bold">{item.item_id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-200">{item.description}</td>
                    
                    {/* Qty Mismatch */}
                    <td className={`py-2.5 px-3 text-center font-bold ${qtyMismatch ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300'}`}>
                      {item.qty_po} <span className="opacity-50">vs</span> {item.qty_inv}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-400">${item.unit_price_po.toFixed(2)}</td>
                    
                    {/* Price Mismatch */}
                    <td className={`py-2.5 px-3 text-right font-bold ${priceMismatch ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300'}`}>
                      ${item.unit_price_inv.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-400">${item.total_po.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">${item.total_inv.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Employee Analysis & Explanation Section */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                AI Employee Analysis & Recommendation
              </h3>
              <p className="text-xs text-slate-400">Structured facts grounded in invoice and PO data</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExplain(exception.id)}
              disabled={isLoadingAI}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{explanationData ? 'Re-Explain' : 'Explain Exception'}</span>
            </button>

            <button
              onClick={() => onSuggestResolution(exception.id)}
              disabled={isLoadingAI}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Suggest Resolution</span>
            </button>
          </div>
        </div>

        {/* AI Loading State */}
        {isLoadingAI && (
          <div className="p-6 text-center text-slate-400 text-xs space-y-2 animate-pulse">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <div>AI Employee analyzing line items and matching contracts...</div>
          </div>
        )}

        {/* Structured Explanation Cards */}
        {explanationData && !isLoadingAI && (
          <div className="space-y-3">
            <div className="glass-card p-3.5 rounded-xl border-l-4 border-l-indigo-500 space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Root Cause</span>
              <p className="text-xs text-slate-200 font-semibold">{explanationData.root_cause}</p>
            </div>

            <div className="glass-card p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Explanation</span>
              <p className="text-xs text-slate-300 leading-relaxed">{explanationData.explanation}</p>
            </div>

            {explanationData.evidence?.length > 0 && (
              <div className="glass-card p-3.5 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Grounded Evidence Facts</span>
                <ul className="space-y-1">
                  {explanationData.evidence.map((fact, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Resolution Suggestion Card */}
        {suggestionData && !isLoadingAI && (
          <div className="glass-card p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-purple-400" />
                AI Recommended Resolution Action
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                suggestionData.risk_level === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                suggestionData.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                Risk Level: {suggestionData.risk_level}
              </span>
            </div>

            <p className="text-xs font-bold text-white">
              {suggestionData.suggested_action}
            </p>
            <p className="text-xs text-slate-300">
              <span className="text-slate-400 font-semibold">Rationale:</span> {suggestionData.rationale}
            </p>
          </div>
        )}
      </div>

      {/* Audit Trail Timeline */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Audit Log & Governance History
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {exception.audit_trail?.length || 0} Events
          </span>
        </div>

        <div className="space-y-3 pl-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {exception.audit_trail?.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 relative z-10 text-xs">
              <div className={`w-3 h-3 rounded-full shrink-0 mt-1 border ${
                log.actor === 'Policy Engine' ? 'bg-emerald-500 border-emerald-400' :
                log.actor === 'AI Employee' ? 'bg-indigo-500 border-indigo-400' :
                log.actor === 'Human Reviewer' ? 'bg-blue-500 border-blue-400' :
                'bg-slate-600 border-slate-500'
              }`} />

              <div className="flex-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                  <span className="font-bold text-slate-300">{log.actor}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-200 font-medium">{log.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Error Guardrail Modal */}
      {policyErrorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Policy Guardrail Enforcement</h3>
                <p className="text-xs text-rose-400 font-semibold">Auto-Resolution Blocked</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono">
              {policyErrorModal}
            </p>

            <button
              onClick={() => setPolicyErrorModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Acknowledge Policy Rule
            </button>
          </div>
        </div>
      )}

      {/* Human Resolution Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleHumanResolveSubmit} className="glass-panel max-w-md w-full p-6 rounded-2xl border border-indigo-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                Human Reviewer Approval
              </h3>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Approving exception <span className="font-mono font-bold text-white">{exception.id}</span> for vendor <span className="font-semibold text-indigo-300">{exception.vendor}</span> (${exception.invoice_amount.toLocaleString()}).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Resolution Notes / Reason:</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter audit approval reason e.g., Vendor verified discount policy / price adjustment authorized..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Submit Sign-off
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
