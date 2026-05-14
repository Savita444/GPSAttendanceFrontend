import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { DashboardAPI } from '../../api/endpoints.js';
import {
  IconUsers, IconLayers, IconCheck, IconCalendar,
} from '../../components/common/Icon.jsx';
import HeatmapCalendar from '../../components/common/HeatmapCalendar.jsx';

const BRAND  = '#1A5DA0';
const BRAND_LIGHT = '#4f8dbe';
const BRAND_DARK  = '#0f2f50';
const ACCENT = '#06b6d4';        // cyan
const ROSE   = '#f43f5e';
const AMBER  = '#f59e0b';
const EMERALD = '#10b981';
const VIOLET = '#a855f7';

// ---------- helpers ----------

function CustomTooltip({ active, payload, label, valueLabel = 'Present' }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl bg-white shadow-xl border border-slate-200 px-3 py-2 text-xs">
      <div className="text-slate-500">{dayjs(label).format('ddd, D MMM')}</div>
      <div className="font-semibold text-slate-900 text-sm mt-0.5">
        {valueLabel}: {payload[0].value}
      </div>
    </div>
  );
}

function KpiCard({ tone, label, value, sub, icon: Ic, sparkline, trend }) {
  const toneCls = {
    brand: 'kpi', emerald: 'kpi kpi-emerald', amber: 'kpi kpi-amber',
    violet: 'kpi kpi-violet', rose: 'kpi kpi-rose', cyan: 'kpi kpi-cyan',
  };
  return (
    <div className={`${toneCls[tone] || toneCls.brand} kpi-glow`}>
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{label}</div>
          <div className="mt-3 text-4xl font-bold leading-none tabular-nums">{value ?? '—'}</div>
          {sub && <div className="mt-2 text-xs text-white/85">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          {Ic ? <Ic size={20} className="text-white" /> : null}
        </div>
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="relative mt-3 -mx-1" style={{ height: 36 }}>
          <ResponsiveContainer>
            <AreaChart data={sparkline} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <defs>
                <linearGradient id={`sk-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count" stroke="#fff" strokeWidth={1.5} fill={`url(#sk-${tone})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {trend !== undefined && (
        <div className="relative mt-2 text-[11px] inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
          <span>{trend >= 0 ? '▲' : '▼'}</span>
          <span className="font-semibold">{Math.abs(trend)}%</span>
          <span className="text-white/80">vs yesterday</span>
        </div>
      )}
    </div>
  );
}

// ---------- main ----------

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    DashboardAPI.summary().then(setData).catch((e) => setErr(e.response?.data?.message || e.message));
    DashboardAPI.insights().then(setInsights).catch(() => {});
  }, []);

  const { todayTrend, weekTrendData } = useMemo(() => {
    const w = data?.weeklyTrend || [];
    if (w.length < 2) return { todayTrend: undefined, weekTrendData: w };
    const last = w[w.length - 1]?.count || 0;
    const prev = w[w.length - 2]?.count || 0;
    const delta = prev > 0 ? +(((last - prev) / prev) * 100).toFixed(1) : (last > 0 ? 100 : 0);
    return { todayTrend: delta, weekTrendData: w };
  }, [data]);

  // For donut: present vs absent of today's total students
  const donutData = useMemo(() => {
    if (!data) return [];
    const present = data.todayPresent || 0;
    const absent = Math.max(0, (data.totalStudents || 0) - present);
    return [
      { name: 'Present', value: present, fill: 'url(#donut-present)' },
      { name: 'Absent', value: absent, fill: 'url(#donut-absent)' },
    ];
  }, [data]);

  // For radial gauge: today's percentage
  const radialData = useMemo(() => {
    const pct = data?.attendancePercentageToday ?? 0;
    return [{ name: 'today', value: pct, fill: BRAND }];
  }, [data]);

  const topColleges = (insights?.byCollege || []).slice(0, 5);
  const topBatches  = (insights?.byBatch || []).slice(0, 6);
  const weekdayAvg  = insights?.weekdayAvg || [];

  const today = dayjs().format('dddd, D MMMM YYYY');

  return (
    <>
      {/* Greeting */}
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-widest text-slate-400">{today}</div>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Good day, Admin <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Live snapshot of attendance across all colleges and batches.</p>
      </div>

      {err && <div className="card p-4 text-rose-600 mb-4">{err}</div>}

      {/* KPI strip with inline sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard tone="brand"   label="Total Students" value={data?.totalStudents?.toLocaleString()} sub="Active across batches" icon={IconUsers}    sparkline={weekTrendData} />
        <KpiCard tone="violet"  label="Active Batches" value={data?.totalBatches?.toLocaleString()}  sub="Across colleges"       icon={IconLayers}   sparkline={weekTrendData} />
        <KpiCard tone="emerald" label="Present Today"  value={data?.todayPresent?.toLocaleString()}  sub={data ? `${data.attendancePercentageToday}% of total` : ''} icon={IconCheck} sparkline={weekTrendData} trend={todayTrend} />
        <KpiCard tone="amber"   label="Today Rate"     value={data ? `${data.attendancePercentageToday}%` : '—'} sub="Attendance ratio today" icon={IconCalendar} sparkline={weekTrendData} />
      </div>

      {/* Row 1: gradient area (2/3) + donut today (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Last 7 days</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily attendance count</p>
            </div>
            <span className="badge-blue">Live</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={weekTrendData} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="weekArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={BRAND}      stopOpacity={0.45} />
                    <stop offset="60%" stopColor={BRAND}      stopOpacity={0.10} />
                    <stop offset="100%" stopColor={BRAND}     stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="weekStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={BRAND_LIGHT} />
                    <stop offset="100%" stopColor={BRAND} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}
                       tickFormatter={(d) => dayjs(d).format('ddd')} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="url(#weekStroke)" strokeWidth={3} fill="url(#weekArea)"
                      dot={{ r: 4, fill: '#fff', stroke: BRAND, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: BRAND, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut: today present vs absent */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Today</h2>
              <p className="text-xs text-slate-500 mt-0.5">Present vs Absent</p>
            </div>
          </div>

          <div className="relative" style={{ height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <defs>
                  <linearGradient id="donut-present" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={BRAND_LIGHT} />
                    <stop offset="100%" stopColor={BRAND} />
                  </linearGradient>
                  <linearGradient id="donut-absent" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
                <Pie
                  data={donutData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                  cornerRadius={6}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{data?.attendancePercentageToday ?? 0}%</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">Attendance</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND }} />
              <span className="text-slate-500">Present</span>
              <span className="ml-auto font-semibold text-slate-900">{donutData[0]?.value ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#cbd5e1' }} />
              <span className="text-slate-500">Absent</span>
              <span className="ml-auto font-semibold text-slate-900">{donutData[1]?.value ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: heatmap + weekday bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Last 30 days</h2>
              <p className="text-xs text-slate-500 mt-0.5">Each cell is one day — darker means more attendance</p>
            </div>
            <span className="badge-slate">Activity</span>
          </div>
          <HeatmapCalendar data={insights?.last30Days || []} maxColor={BRAND} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Weekday avg</h2>
              <p className="text-xs text-slate-500 mt-0.5">Avg attendance per weekday (last 30d)</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={weekdayAvg} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="wdBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={BRAND_LIGHT} />
                    <stop offset="100%" stopColor={BRAND} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.10)' }}
                  cursor={{ fill: 'rgba(26,93,160,0.05)' }}
                />
                <Bar dataKey="avg" fill="url(#wdBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: top colleges horizontal bar + top batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Top colleges today</h2>
              <p className="text-xs text-slate-500 mt-0.5">Attendance percentage</p>
            </div>
            <span className="badge-blue">{topColleges.length}</span>
          </div>
          {topColleges.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">No data yet</div>
          ) : (
            <div className="space-y-3">
              {topColleges.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">{c.name}</span>
                      <span className="text-xs text-slate-500 tabular-nums">{c.present}/{c.total}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                           style={{
                             width: `${Math.min(100, c.percentage)}%`,
                             background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND})`,
                           }} />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 tabular-nums w-12 text-right">{c.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Top batches today</h2>
              <p className="text-xs text-slate-500 mt-0.5">Highest attendance batches</p>
            </div>
            <span className="badge-violet">{topBatches.length}</span>
          </div>
          {topBatches.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">No data yet</div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={topBatches} margin={{ top: 4, right: 16, bottom: 0, left: 12 }}>
                  <defs>
                    <linearGradient id="batchBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"  stopColor={VIOLET} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={BRAND} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.10)' }}
                    cursor={{ fill: 'rgba(26,93,160,0.05)' }}
                    formatter={(v, _n, p) => [`${v}% (${p.payload.present}/${p.payload.total})`, p.payload.name]}
                  />
                  <Bar dataKey="percentage" fill="url(#batchBar)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wave-rotate { 0%, 60%, 100% { transform: rotate(0); } 10%, 30% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } }
        .animate-wave { display: inline-block; transform-origin: 70% 70%; animation: wave-rotate 2.5s ease-in-out infinite; }
      `}</style>
    </>
  );
}
