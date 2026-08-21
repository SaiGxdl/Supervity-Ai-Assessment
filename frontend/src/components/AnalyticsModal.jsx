import React from 'react';
import { X, BarChart3, PieChart as PieIcon, ShieldAlert } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from 'recharts';

export default function AnalyticsModal({ metrics, onClose }) {
  if (!metrics) return null;

  // Prepare Bar chart data for exception categories
  const categoryData = Object.entries(metrics.by_type || {}).map(([key, count]) => ({
    name: key.replace(/_/g, ' '),
    count: count,
  }));

  // Prepare Status Pie chart data
  const statusData = [
    { name: 'Auto-Resolved', value: metrics.auto_resolved_count || 0, color: '#10b981' },
    { name: 'Manually Resolved', value: metrics.manually_resolved_count || 0, color: '#3b82f6' },
    { name: 'Pending', value: metrics.pending_count || 0, color: '#f59e0b' },
    { name: 'Escalated', value: metrics.escalated_count || 0, color: '#a855f7' },
  ].filter(d => d.value > 0);

  // Prepare Risk Pie chart data
  const riskData = [
    { name: 'High Risk', value: metrics.high_risk_count || 0, color: '#ef4444' },
    { name: 'Medium Risk', value: metrics.medium_risk_count || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: metrics.low_risk_count || 0, color: '#3b82f6' },
  ];

  const BAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Exception Analytics & Governance Insights
              </h2>
              <p className="text-xs text-slate-400">
                Real-Time Exception Metrics & Resolution Distribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chart 1: Exception Category Distribution */}
          <div className="glass-card p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Exception Volume by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 9 }} 
                    interval={0} 
                    angle={-25} 
                    textAnchor="end" 
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Resolution Status Breakdown */}
          <div className="glass-card p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              Resolution Status Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Bottom Metrics Bar Summary */}
        <div className="glass-card p-4 rounded-xl flex flex-wrap items-center justify-around gap-4 text-center border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Exceptions</span>
            <div className="text-lg font-extrabold text-white">{metrics.total_exceptions}</div>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Auto Resolution Rate</span>
            <div className="text-lg font-extrabold text-emerald-400">
              {Math.round((metrics.auto_resolved_count / (metrics.total_exceptions || 1)) * 100)}%
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Overall Resolution Rate</span>
            <div className="text-lg font-extrabold text-indigo-400">{metrics.resolution_rate_pct}%</div>
          </div>
        </div>

      </div>
    </div>
  );
}
