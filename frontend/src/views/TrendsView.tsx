import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  FileSpreadsheet,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../services/api';

import { PageHeader } from '../components/ui/PageHeader';

const COLORS = ['#059669', '#d97706', '#dc2626', '#2563eb', '#7c3aed', '#0891b2'];

export const TrendsView: React.FC = () => {
  const { selectedField, t, language } = useApp();
  const [historyData, setHistoryData] = useState<any>(null);
  const [days, setDays] = useState<number>(30);
  const [nodeFilter, setNodeFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHistory();
  }, [days, nodeFilter, selectedField?.field_id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory(days, nodeFilter || undefined, selectedField?.field_id);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !historyData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-xs">Loading historical trends & analytics...</p>
        </div>
      </div>
    );
  }

  // Format Recharts area series
  const chartData = historyData?.labels.map((label: string, i: number) => {
    const item: any = { date: label, total: historyData.daily_all[i] || 0 };
    historyData.series.forEach((s: any) => {
      item[s.name || s.node] = s.values[i] || 0;
    });
    return item;
  }) || [];

  // Species distribution for Pie chart
  const pieData = historyData?.by_pest?.map((p: any) => ({
    name: language === 'kn' ? p.kn : p.en,
    value: p.total,
  })) || [];

  const summary = historyData?.summary || {};
  const isRising = summary.change_pct !== null && summary.change_pct > 15;
  const isFalling = summary.change_pct !== null && summary.change_pct < -15;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <PageHeader
        category="Time-Series Insect Dynamics & Analytics"
        icon={Activity}
        title="Insect Counts & Population Dynamics"
        description={
          language === 'kn'
            ? 'ದೈನಂದಿನ, ವಾರಕ್ಕೊಮ್ಮೆ ಮತ್ತು ತಿಂಗಳ ಕೀಟಗಳ ಎಣಿಕೆ ಬದಲಾವಣೆ ಹಾಗೂ ಸಿಂಪಡಣೆಯ ಪ್ರಭಾವ'
            : 'Multi-period insect count trajectories, peak occurrence days, and post-treatment reductions'
        }
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Day range filter buttons */}
            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15 text-xs font-bold">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    days === d
                      ? 'bg-white text-emerald-950 shadow-sm font-extrabold'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <a
              href={api.getReportCsvUrl(days, selectedField?.field_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 min-h-[40px]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        }
      />


      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Total Insects ({days}d)
          </span>
          <span className="text-2xl font-black text-stone-950">{summary.total || 0}</span>
          <p className="text-[11px] text-stone-500 mt-1">Across all monitored traps</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Daily Average
          </span>
          <span className="text-2xl font-black text-stone-950">{summary.avg_per_day || 0}</span>
          <p className="text-[11px] text-stone-500 mt-1">New catches per calendar day</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Peak Activity Day
          </span>
          <span className="text-lg font-black text-stone-900">{summary.peak_day || '—'}</span>
          <p className="text-[11px] text-stone-500 mt-1">{summary.peak_value || 0} catches at highest</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Change vs Prev Period
          </span>
          <div className="flex items-center gap-1.5">
            {isRising ? (
              <span className="text-lg font-black text-red-600 flex items-center">
                <ArrowUpRight className="w-5 h-5" />
                +{summary.change_pct}%
              </span>
            ) : isFalling ? (
              <span className="text-lg font-black text-emerald-600 flex items-center">
                <ArrowDownRight className="w-5 h-5" />
                {summary.change_pct}%
              </span>
            ) : (
              <span className="text-lg font-black text-stone-700 flex items-center">
                <Minus className="w-5 h-5" />
                {summary.change_pct ? `${summary.change_pct}%` : 'Stable'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Trend: {historyData?.trend_direction || 'Stable'}</p>
        </div>
      </div>

      {/* Main Charts: Daily Trend Area Chart */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Daily Catches Over Time (Hardware Verified)
            </h3>
            <p className="text-xs text-stone-500">
              Aggregated daily new insect catches on sticky traps and pheromones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Total Catches</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1917',
                  color: '#fff',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Insects"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Visualizations: Trap Breakdown & Species Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trap Comparison Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Trap-Wise Insect Load Comparison
            </h3>
            <p className="text-xs text-stone-500">
              Total catches recorded by each node over {days} days
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historyData?.series?.map((s: any) => ({
                  name: s.name || s.node,
                  total: s.total,
                  pest: s.pest,
                })) || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" fill="#059669" radius={[8, 8, 0, 0]} name="Insects Counted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Species Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Insect Species Distribution
            </h3>
            <p className="text-xs text-stone-500">
              Proportion of detected pest types across this field
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-stone-400 text-xs">No species distribution data</div>
            )}
          </div>
        </div>
      </div>

      {/* Event Timeline / Intervention Marks */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-stone-900">
          Field Event Timeline & Spray Interventions
        </h3>
        <p className="text-xs text-stone-500">
          Chronological record of card replacements, alerts triggered, and spray efficacy
        </p>

        <div className="divide-y divide-stone-100 text-xs">
          {historyData?.events?.slice(0, 10).map((ev: any, idx: number) => (
            <div key={idx} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  ev.type === 'spray'
                    ? 'bg-emerald-100 text-emerald-800'
                    : ev.type === 'alert'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-stone-100 text-stone-700'
                }`}>
                  {ev.type === 'spray' ? 'S' : ev.type === 'alert' ? '!' : 'C'}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">
                    {language === 'kn' ? (ev.kn || ev.en) : ev.en}
                  </h4>
                  {ev.effect && (
                    <p className="text-emerald-700 font-semibold mt-0.5">
                      Catches changed by {ev.effect.change_pct}% after spray ({ev.effect.before_per_day}/day → {ev.effect.after_per_day}/day).
                    </p>
                  )}
                </div>
              </div>
              <span className="font-mono text-stone-400 shrink-0">
                {new Date(ev.ts * 1000).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
