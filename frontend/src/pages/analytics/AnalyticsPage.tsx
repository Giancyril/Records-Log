/**
 * Analytics.tsx
 * Computed entirely from /records (all pages fetched once).
 * Uses recharts — run:  npm install recharts
 */
import { useMemo, useState } from "react";
import { useGetRecordsQuery, useGetRecordStatsQuery } from "../../redux/api/api";
import type { Record as Doc, RecordStats } from "../../types/types";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FaFileAlt, FaInbox, FaShare, FaClock,
  FaCheckCircle, FaBoxOpen, FaChartBar,
} from "react-icons/fa";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  blue:    "#3b82f6",
  purple:  "#a855f7",
  cyan:    "#06b6d4",
  amber:   "#f59e0b",
  emerald: "#10b981",
  rose:    "#f43f5e",
  indigo:  "#6366f1",
  gray:    "#374151",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: 12,
  color: "#f9fafb",
  fontSize: 12,
  boxShadow: "0 12px 48px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.05)",
  padding: "8px 12px",
};

const AXIS_STYLE = { fill: "#6b7280", fontSize: 11 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const monthKey  = (d: string) => d.slice(0, 7);
const weekKey   = (d: string) => {
  const dt = new Date(d);
  const y   = dt.getFullYear();
  const jan1 = new Date(y, 0, 1);
  const wk   = Math.ceil(((+dt - +jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${String(wk).padStart(2, "0")} '${String(y).slice(2)}`;
};
const dayKey    = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

type Granularity = "day" | "week" | "month";

function groupByTime(records: Doc[], gran: Granularity) {
  const keyFn = gran === "month" ? monthKey : gran === "week" ? weekKey : dayKey;
  const map = new Map<string, { key: string; incoming: number; outgoing: number; total: number; growth?: number }>();
  records.forEach(r => {
    const k = keyFn(r.createdAt);
    if (!map.has(k)) map.set(k, { key: k, incoming: 0, outgoing: 0, total: 0 });
    const e = map.get(k)!;
    e.total++;
    r.type === "INCOMING" ? e.incoming++ : e.outgoing++;
  });
  
  const sorted = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  // Calculate growth
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].total;
    if (prev > 0) sorted[i].growth = Math.round(((sorted[i].total - prev) / prev) * 100);
    else sorted[i].growth = 0;
  }
  return sorted.slice(-24);
}

function groupByCategory(records: Doc[]) {
  const map = new Map<string, number>();
  records.forEach(r => {
    const k = r.category || "Uncategorized";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function groupByOffice(records: Doc[], field: "fromOffice" | "toOffice") {
  const map = new Map<string, number>();
  records.forEach(r => {
    const k = r[field] || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function processingTime(records: Doc[]) {
  const buckets: Record<string, number> = {
    "Same day": 0, "1–2 days": 0, "3–7 days": 0, "8–30 days": 0, ">30 days": 0,
  };
  records.forEach(r => {
    if (!r.receivedAt) return;
    const diff = Math.floor((+new Date(r.receivedAt) - +new Date(r.createdAt)) / 86400000);
    if (diff <= 0)       buckets["Same day"]++;
    else if (diff <= 2)  buckets["1–2 days"]++;
    else if (diff <= 7)  buckets["3–7 days"]++;
    else if (diff <= 30) buckets["8–30 days"]++;
    else                 buckets[">30 days"]++;
  });
  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-3 bg-gradient-to-r from-white/[0.02] to-transparent">
      <div>
        <p className="text-white text-sm font-semibold tracking-tight">{title}</p>
        {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const COLORS_PIE = [C.blue, C.purple, C.cyan, C.amber, C.emerald, C.rose, C.indigo, "#8b5cf6"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2.5 min-w-[120px]">
      {label && <p className="text-gray-400 text-[10px] mb-1.5 font-bold uppercase tracking-wide">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-gray-300 text-xs capitalize">{p.name}</span>
          <span className="text-white text-xs font-bold ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 w-56 bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-800 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [gran, setGran] = useState<Granularity>("month");

  const { data: allData, isLoading: loadingRecords } =
    useGetRecordsQuery({ limit: 1000, page: 1 });
  const { data: statsData, isLoading: loadingStats } =
    useGetRecordStatsQuery(undefined);

  const records: Doc[]                 = allData?.data?.records ?? allData?.data ?? [];
  const stats: RecordStats | undefined = statsData?.data;

  const isLoading = loadingRecords || loadingStats;

  const timeData     = useMemo(() => groupByTime(records, gran), [records, gran]);
  const categoryData = useMemo(() => groupByCategory(records), [records]);
  const fromData     = useMemo(() => groupByOffice(records, "fromOffice"), [records]);
  const toData       = useMemo(() => groupByOffice(records, "toOffice"), [records]);
  const procData     = useMemo(() => processingTime(records), [records]);

  const statusPie = useMemo(() => [
    { name: "Pending",  value: stats?.pending  ?? 0, color: C.amber },
    { name: "Received", value: stats?.received ?? 0, color: C.blue },
    { name: "Released", value: stats?.released ?? 0, color: C.emerald },
  ], [stats]);

  const typePie = useMemo(() => [
    { name: "Incoming", value: stats?.incoming ?? 0, color: C.purple },
    { name: "Outgoing", value: stats?.outgoing ?? 0, color: C.cyan },
  ], [stats]);

  const avgProcHours = useMemo(() => {
    const withReceived = records.filter(r => r.receivedAt);
    if (!withReceived.length) return null;
    const total = withReceived.reduce((acc, r) =>
      acc + (+new Date(r.receivedAt!) - +new Date(r.createdAt)), 0);
    return Math.round(total / withReceived.length / 3600000);
  }, [records]);

  const receiveRate = stats && stats.total > 0
    ? Math.round(((stats.received + stats.released) / stats.total) * 100)
    : 0;

  if (isLoading) return <Skeleton />;

  const total = stats?.total ?? records.length;

  return (
    <div className="space-y-6 w-full overflow-x-hidden pb-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <p className="text-gray-600 text-[11px] uppercase tracking-widest font-semibold mb-2 text-blue-300/70">Analytics Dashboard</p>
          <h1 className="text-white text-3xl font-bold tracking-tight leading-tight">
            Records Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-2 text-opacity-80">
            Computed from {total} record{total !== 1 ? "s" : ""} · Real-time insights
          </p>
        </div>

        <div className="flex gap-2 bg-gray-900/60 rounded-xl p-1.5 backdrop-blur-sm">
          {(["day", "week", "month"] as Granularity[]).map(g => (
            <button
              key={g}
              onClick={() => setGran(g)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                gran === g
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Active",     value: total,                      icon: FaFileAlt,     color: C.blue,    bg: "from-blue-500/20 to-blue-500/5", subValue: `${receiveRate}% RCV Rate` },
          { label: "Archived",         value: stats?.archived ?? 0,       icon: FaBoxOpen,    color: C.rose,    bg: "from-rose-500/20 to-rose-500/5" },
          { label: "Avg. Process",     value: avgProcHours != null ? `${avgProcHours}h` : "—", icon: FaClock, color: C.amber, bg: "from-amber-500/20 to-amber-500/5" },
          { label: "Added This Week",  value: stats?.weekCount ?? 0,      icon: FaChartBar,    color: C.purple,  bg: "from-purple-500/20 to-purple-500/5" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-white/20 transition-all duration-300 group`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-xs font-semibold tracking-tight">{label}</p>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold tracking-tight" style={{ color }}>{value}</p>
              {"subValue" in (label === "Total Active" ? {subValue: `${receiveRate}% RCV Rate`} : {}) && (
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label === "Total Active" ? `${receiveRate}% Recv` : ""}</span>
              )}
            </div>
            <div className="h-1 w-12 mt-3 rounded-full" style={{ background: color, opacity: 0.3 }}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aging Pending */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.2"/>
                <line x1="8" y1="4.5" x2="8" y2="8.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="8" cy="10.5" r="0.8" fill="#f59e0b"/>
              </svg>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Needs attention
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Workflow Insight</p>
            <p className="text-sm font-semibold text-white mt-0.5">Aging Pending Records</p>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">{stats?.agingPending ?? 0}</span>
            <span className="text-xs text-gray-600">records</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Pending more than 3 days and likely needing attention.
          </p>
        </div>

        {/* High Urgency */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10.2 6.5L15 7.2L11.5 10.6L12.4 15.4L8 13L3.6 15.4L4.5 10.6L1 7.2L5.8 6.5L8 2Z"
                  stroke="#f43f5e" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              High urgency
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Priority Signals</p>
            <p className="text-sm font-semibold text-white mt-0.5">Urgent Records</p>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400">{stats?.urgentPending ?? 0}</span>
            <span className="text-xs text-gray-600">records</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Pending records with urgent language in the title or subject.
          </p>
        </div>

        {/* Uncategorized */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="2" rx="1" fill="#6b7280"/>
                <rect x="2" y="7" width="8" height="2" rx="1" fill="#6b7280"/>
                <rect x="2" y="11" width="5" height="2" rx="1" fill="#6b7280"/>
                <circle cx="13" cy="12" r="2.2" stroke="#6b7280" strokeWidth="1.2"/>
                <line x1="13" y1="10.5" x2="13" y2="12" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="13" y1="12" x2="14" y2="12.8" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
              Tagging health
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Tagging Health</p>
            <p className="text-sm font-semibold text-white mt-0.5">Uncategorized</p>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-300">{stats?.uncategorized ?? 0}</span>
            <span className="text-xs text-gray-600">records</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Records missing category tags — smart tagging helps reduce this.
          </p>
        </div>
      </div>

      {/* ── Volume + Growth ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Volume Over Time" sub={`Records created — grouped by ${gran}`} />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            {timeData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOutgoing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.cyan} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="key" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingTop: 12 }} />
                  <Area type="monotone" dataKey="incoming" name="Incoming" stroke={C.purple} strokeWidth={2} fill="url(#gIncoming)" dot={false} />
                  <Area type="monotone" dataKey="outgoing" name="Outgoing" stroke={C.cyan}   strokeWidth={2} fill="url(#gOutgoing)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Period Growth" sub={`Trend compared to previous ${gran}`} />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            {timeData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={timeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="key" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="growth" name="Growth %" radius={[6, 6, 0, 0]} maxBarSize={24}>
                    {timeData.map((d, i) => <Cell key={i} fill={(d.growth ?? 0) >= 0 ? C.emerald : C.rose} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── Status pie + Type pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Status Distribution" sub="Pending · Received · Released" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-3">
              {statusPie.map(({ name, value, color }) => (
                <div key={name} className="group">
                  <div className="flex justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
                      <span className="text-gray-300 font-medium">{name}</span>
                    </div>
                    <span className="text-white font-bold tabular-nums">{value}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%", background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Type Distribution" sub="Incoming vs Outgoing" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={typePie} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {typePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-4">
              {typePie.map(({ name, value, color }) => (
                <div key={name} className="flex flex-col gap-2 group">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}40` }} />
                      <span className="text-gray-300 text-xs font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs font-medium">
                        {total > 0 ? `${Math.round((value / total) * 100)}%` : "0%"}
                      </span>
                      <span className="text-white text-xs font-bold tabular-nums">{value}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%", background: color }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-white/10">
                <p className="text-gray-600 text-xs mb-3 uppercase tracking-widest font-semibold text-blue-300/70">Distribution</p>
                <div className="flex h-2.5 rounded-full overflow-hidden gap-1">
                  {typePie.map(({ name, value, color }) => (
                    <div key={name} className="transition-all duration-700 rounded-full" style={{ width: total > 0 ? `${(value / total) * 100}%` : "50%", background: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Category bar + Processing time bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Category breakdown */}
        <Card>
          <CardHeader title="Records by Category" sub="All categories ranked by volume" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            {categoryData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" name="Records" radius={[0, 6, 6, 0]} maxBarSize={18} background={{ fill: "transparent" }}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Processing time */}
        <Card>
          <CardHeader title="Processing Time" sub="Days from submitted → received" />
          <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent">
            {procData.every(d => d.value === 0) ? <EmptyChart label="No received records yet" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={procData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" name="Records" radius={[6, 6, 0, 0]} maxBarSize={36} background={{ fill: "transparent" }}>
                    {procData.map((_, i) => (
                      <Cell key={i} fill={[C.emerald, C.blue, C.amber, C.rose, "#ef4444"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── From Office + To Office ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OfficeRankCard title="Top Sending Offices"   sub="Most active 'From' offices" data={fromData} />
        <OfficeRankCard title="Top Receiving Offices" sub="Most active 'To' offices"   data={toData}   color={C.cyan} />
      </div>

      {/* ── Summary footer ── */}
      <Card>
        <CardHeader title="Summary Metrics" sub="Key performance indicators" />
        <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total",    value: total,                icon: FaFileAlt,     color: C.blue },
            { label: "Incoming", value: stats?.incoming ?? 0, icon: FaInbox,       color: C.purple },
            { label: "Outgoing", value: stats?.outgoing ?? 0, icon: FaShare,       color: C.cyan },
            { label: "Pending",  value: stats?.pending  ?? 0, icon: FaClock,       color: C.amber },
            { label: "Received", value: stats?.received ?? 0, icon: FaCheckCircle, color: C.blue },
            { label: "Released", value: stats?.released ?? 0, icon: FaBoxOpen,     color: C.emerald },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-gray-700 hover:border-gray-600 transition-all duration-300 group">
              <div className="flex justify-center mb-3">
                <Icon size={16} className="group-hover:scale-110 transition-transform duration-300" style={{ color }} />
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
              <p className="text-gray-500 text-[11px] mt-1.5 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

// ─── Office rank card ─────────────────────────────────────────────────────────
function OfficeRankCard({
  title, sub, data, color = C.blue,
}: { title: string; sub: string; data: { name: string; value: number }[]; color?: string }) {
  const max = data[0]?.value || 1;
  return (
    <Card>
      <CardHeader title={title} sub={sub} />
      <div className="p-6 bg-gradient-to-br from-white/[0.01] to-transparent space-y-4">
        {data.length === 0 ? (
          <EmptyChart label="No office data yet" />
        ) : (
          data.map(({ name, value }, i) => (
            <div key={name} className="group">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-600 font-bold w-5 shrink-0 tabular-nums bg-gradient-to-br from-white/10 to-white/5 px-1.5 py-0.5 rounded text-center" style={{ color }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-gray-300 truncate font-medium">{name}</span>
                </div>
                <span className="text-white font-bold ml-2 shrink-0 tabular-nums">{value}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-900/60 rounded-full overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, background: color }} />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-3">
      <FaChartBar size={32} className="text-gray-700/50" />
      <p className="text-gray-500 text-sm font-medium">{label}</p>
    </div>
  );
}