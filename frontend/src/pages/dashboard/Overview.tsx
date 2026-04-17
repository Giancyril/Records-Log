import { useGetRecordStatsQuery } from "../../redux/api/api";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt, FaInbox, FaShare,
  FaArrowRight, FaChevronRight,
} from "react-icons/fa";
import type { RecordStats } from "../../types/types";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const STATUS_COLOR: Record<string, { pill: string; dot: string }> = {
  PENDING:  { pill: "bg-amber-500/15 text-amber-400 border-amber-500/20",   dot: "bg-amber-400" },
  RECEIVED: { pill: "bg-blue-500/15 text-blue-400 border-blue-500/20",      dot: "bg-blue-400" },
  RELEASED: { pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
};

const TYPE_COLOR: Record<string, string> = {
  INCOMING: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  OUTGOING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

// Thin horizontal bar component
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}


// Skeleton loader
function Skeleton() {
  return (
    <div className="space-y-6 w-full overflow-x-hidden animate-pulse">
      <div className="h-9 w-52 bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-800 rounded-2xl" />
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetRecordStatsQuery(undefined);
  const stats = data?.data as RecordStats | undefined;

  if (isLoading) return <Skeleton />;

  const total    = stats?.total    ?? 0;
  const incoming = stats?.incoming ?? 0;
  const outgoing = stats?.outgoing ?? 0;
  const pending  = stats?.pending  ?? 0;
  const received = stats?.received ?? 0;
  const released = stats?.released ?? 0;
  const today    = stats?.todayCount ?? 0;
  const week     = stats?.weekCount  ?? 0;

  // Top 4 primary stat cards
  const primaryCards = [
    {
      label: "Total Records",
      value: total,
      icon: FaFileAlt,
      accent: "#3b82f6",
      accentCls: "text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      ring: { color: "#3b82f6", max: total || 1, value: total },
      sub: `${today} added today`,
    },
    {
      label: "Incoming",
      value: incoming,
      icon: FaInbox,
      accent: "#a855f7",
      accentCls: "text-purple-400",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      ring: { color: "#a855f7", max: total || 1, value: incoming },
      sub: total > 0 ? `${Math.round((incoming / total) * 100)}% of total` : "—",
    },
    {
      label: "Outgoing",
      value: outgoing,
      icon: FaShare,
      accent: "#06b6d4",
      accentCls: "text-cyan-400",
      iconBg: "bg-cyan-500/10 border-cyan-500/20",
      ring: { color: "#06b6d4", max: total || 1, value: outgoing },
      sub: total > 0 ? `${Math.round((outgoing / total) * 100)}% of total` : "—",
    },
    {
      label: "This Week",
      value: week,
      icon: FaFileAlt,
      accent: "#f59e0b",
      accentCls: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      ring: { color: "#f59e0b", max: Math.max(week, 1), value: week },
      sub: `${today} added today`,
    },
  ];

  // Status breakdown bars
  const statusBreakdown = [
    { label: "Pending",  value: pending,  bar: "bg-amber-400",   max: total },
    { label: "Received", value: received, bar: "bg-blue-400",    max: total },
    { label: "Released", value: released, bar: "bg-emerald-400", max: total },
  ];

  return (
    <div className="space-y-5 w-full overflow-x-hidden">

      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Dashboard</p>
          <h1 className="text-white text-2xl font-black tracking-tight leading-none">Overview</h1>
          <p className="text-gray-500 text-xs mt-1">NBSC SAS Records Log — real-time summary</p>
        </div>
        <button
          onClick={() => navigate("/records/new")}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          + New Record
        </button>
      </div>

      {/* ── Primary stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {primaryCards.map(({ label, value, icon: Icon, accentCls, iconBg, sub }) => (
          <div
            key={label}
            className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${iconBg}`}>
                <Icon size={12} className={accentCls} />
              </div>
              
            </div>
            <div>
              <p className={`text-3xl font-black leading-none ${accentCls}`}>{value}</p>
              <p className="text-gray-400 text-xs font-semibold mt-1">{label}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Second row: Status breakdown + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Status breakdown */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white text-sm font-bold">Status Breakdown</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Distribution across all records</p>
            </div>
            <span className="px-2 py-1 bg-white/5 text-gray-400 text-[10px] font-bold rounded-lg border border-white/5">
              {total} total
            </span>
          </div>

          <div className="space-y-4">
            {statusBreakdown.map(({ label, value, bar, max }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bar}`} />
                    <span className="text-gray-300 text-xs font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-[10px]">
                      {max > 0 ? `${Math.round((value / max) * 100)}%` : "0%"}
                    </span>
                    <span className="text-white text-xs font-bold w-6 text-right">{value}</span>
                  </div>
                </div>
                <Bar value={value} max={max} color={bar} />
              </div>
            ))}
          </div>

          {/* Inline mini legend */}
          <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
            {[
              { label: "Pending",  value: pending,  cls: "text-amber-400" },
              { label: "Received", value: received, cls: "text-blue-400" },
              { label: "Released", value: released, cls: "text-emerald-400" },
            ].map(({ label, value: v, cls }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-black ${cls}`}>{v}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats panel */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <p className="text-white text-sm font-bold">Activity</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Volume over time</p>
          </div>

          <div className="flex-1 space-y-3">
            {[
              { label: "Added today",     value: today, accent: "text-white",        bg: "bg-white/5 border-gray-700" },
              { label: "Added this week", value: week,  accent: "text-blue-400",     bg: "bg-blue-500/8 border-blue-500/15" },
              { label: "Total records",   value: total, accent: "text-purple-400",   bg: "bg-purple-500/8 border-purple-500/15" },
            ].map(({ label, value: v, accent, bg }) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${bg}`}>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className={`text-lg font-black ${accent}`}>{v}</p>
              </div>
            ))}
          </div>

          {/* Type split */}
          <div className="pt-3 border-t border-white/5">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-3">Type Split</p>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              {total > 0 ? (
                <>
                  <div
                    className="bg-purple-500 rounded-l-full transition-all duration-700"
                    style={{ width: `${(incoming / total) * 100}%` }}
                  />
                  <div
                    className="bg-cyan-500 rounded-r-full transition-all duration-700"
                    style={{ width: `${(outgoing / total) * 100}%` }}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-800 rounded-full" />
              )}
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-500 text-[10px]">Incoming ({incoming})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-gray-500 text-[10px]">Outgoing ({outgoing})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent records ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Records</h2>
            <p className="text-gray-500 text-[10px] mt-0.5">Latest document activity</p>
          </div>
          <button
            onClick={() => navigate("/records")}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors"
          >
            View all <FaArrowRight size={9} />
          </button>
        </div>

        {!stats?.recentRecords?.length ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-white/5 flex items-center justify-center mx-auto mb-3">
              <FaFileAlt size={20} className="text-gray-700" />
            </div>
            <p className="text-gray-400 text-sm font-medium">No records yet</p>
            <p className="text-gray-600 text-xs mt-1">Create your first record to see it here</p>
            <button
              onClick={() => navigate("/records/new")}
              className="mt-4 px-4 py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl transition-all"
            >
              + New Record
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {stats.recentRecords.map((r, idx) => (
              <div
                key={r.id}
                onClick={() => navigate(`/records/${r.id}`)}
                className="group flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Index number */}
                <span className="text-gray-700 text-[10px] font-bold w-4 shrink-0 tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  r.type === "INCOMING"
                    ? "bg-purple-500/10 border-purple-500/20"
                    : "bg-cyan-500/10 border-cyan-500/20"
                }`}>
                  {r.type === "INCOMING"
                    ? <FaInbox size={11} className="text-purple-400" />
                    : <FaShare size={11} className="text-cyan-400" />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{r.documentTitle}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5 truncate">
                    {r.personName} · {fmt(r.createdAt)}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[r.type]}`}>
                    {r.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[r.status].pill}`}>
                    {r.status}
                  </span>
                </div>

                {/* Chevron */}
                <FaChevronRight size={9} className="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}