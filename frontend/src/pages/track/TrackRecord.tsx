import { useState } from "react";
import { useTrackRecordQuery } from "../../redux/api/api";
import {
  FaSearch, FaCheck, FaFileAlt, FaUser, 
  FaArrowRight, FaArrowLeft, FaTag, FaCalendarAlt, FaInfoCircle,
  FaCheckCircle, FaTimesCircle, FaBarcode,
} from "react-icons/fa";
import type { TrackedRecord } from "../../types/types";

const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   dot: "bg-amber-400",   glow: "shadow-amber-500/10" },
  RECEIVED: { label: "Received", color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",     dot: "bg-blue-400",    glow: "shadow-blue-500/10" },
  RELEASED: { label: "Released", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", glow: "shadow-emerald-500/10" },
};

const TYPE_CONFIG = {
  INCOMING: { label: "Incoming", color: "text-purple-400", bg: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  OUTGOING: { label: "Outgoing", color: "text-cyan-400",   bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : null;

const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : null;

const fmtShort = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* ─── Timeline Step ─── */
function TimelineStep({ label, time, done, isLast }: { label: string; time?: string | null; done: boolean; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
          done ? "bg-emerald-500/20 border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "bg-gray-800 border-white/5"
        }`}>
          {done
            ? <FaCheck size={9} className="text-emerald-400" />
            : <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          }
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${done ? "bg-emerald-500/30" : "bg-white/5"}`} style={{ minHeight: 20 }} />
        )}
      </div>
      <div className="pb-5 min-w-0">
        <p className={`text-xs font-semibold ${done ? "text-white" : "text-gray-600"}`}>{label}</p>
        {time
          ? <p className="text-gray-500 text-[10px] mt-0.5">{fmtTime(time)}</p>
          : <p className="text-gray-700 text-[10px] mt-0.5">Pending</p>
        }
      </div>
    </div>
  );
}

/* ─── Info Cell ─── */
function InfoCell({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-gray-800/40 border border-white/[0.04] rounded-xl px-4 py-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        {icon && <span className="text-gray-600">{icon}</span>}
        {label}
      </p>
      <p className="text-white text-sm font-medium break-words leading-snug">{value || "—"}</p>
    </div>
  );
}

/* ─── Tracking Result ─── */
function TrackingResult({ record }: { record: TrackedRecord }) {
  const status = STATUS_CONFIG[record.status];
  const type   = TYPE_CONFIG[record.type];

  const steps = [
    { label: "Submitted", time: record.createdAt,  done: true },
    { label: "Received",  time: record.receivedAt,  done: !!record.receivedAt },
    { label: "Released",  time: record.releasedAt,  done: !!record.releasedAt },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="space-y-4 w-full">

      {/* ════════════════════════════════════════
          DESKTOP LAYOUT
      ════════════════════════════════════════ */}
      <div className="hidden sm:block space-y-3">

        {/* ── Table card: header + row ── */}
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
            <div className="col-span-5">Document</div>
            <div className="col-span-2">Person</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Progress</div>
          </div>

          {/* Data row */}
          <div className="grid grid-cols-12 gap-4 items-center px-6 py-5">
            {/* Document — with inline status dot */}
            <div className="col-span-5 min-w-0 flex items-start gap-3">
              <div className="mt-1.5 shrink-0">
                <div className="relative w-2.5 h-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
                  <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${status.dot}`} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate leading-tight">{record.documentTitle}</p>
                {record.documentNumber && (
                  <p className="text-blue-400/70 text-[11px] mt-0.5 font-medium">#{record.documentNumber}</p>
                )}
                <p className="text-gray-600 text-[11px] mt-0.5">{fmtShort(record.documentDate)}</p>
              </div>
            </div>

            {/* Person */}
            <div className="col-span-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-700 border border-white/10 flex items-center justify-center shrink-0">
                  <FaUser size={8} className="text-gray-400" />
                </div>
                <p className="text-gray-200 text-sm truncate">{record.personName}</p>
              </div>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${type.bg}`}>
                {type.label}
              </span>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Progress mini bar */}
            <div className="col-span-1 flex flex-col items-end gap-1">
              <p className="text-[10px] font-bold text-gray-500">{progressPct}%</p>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Details + Timeline row ── */}
        <div className="grid grid-cols-12 gap-3">

          {/* Left: Details (8 cols) */}
          <div className="col-span-8 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            {/* Sub-header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Document Details</p>
              <p className="text-[10px] text-gray-700">
                Last updated: <span className="text-gray-600">{fmtTime(record.updatedAt)}</span>
              </p>
            </div>

            <div className="p-5 space-y-3">
              {/* Row 1: 3 cells */}
              <div className="grid grid-cols-3 gap-3">
                <InfoCell label="Submitted By"  value={record.personName}        icon={<FaUser size={9} />} />
                <InfoCell label="Category"      value={record.category}          icon={<FaTag size={9} />} />
                <InfoCell label="Document Date" value={fmt(record.documentDate)} icon={<FaCalendarAlt size={9} />} />
              </div>
              {/* Row 2: 3 cells */}
              <div className="grid grid-cols-3 gap-3">
                <InfoCell label="Subject"     value={record.subject}   icon={<FaInfoCircle size={9} />} />
                <InfoCell label="From Office" value={record.fromOffice} icon={<FaArrowRight size={9} />} />
                <InfoCell label="To Office"   value={record.toOffice}   icon={<FaArrowLeft size={9} />} />
              </div>

              {/* Action Taken */}
              {record.actionTaken && (
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FaCheckCircle size={9} /> Action Taken
                  </p>
                  <p className="text-white text-sm leading-relaxed">{record.actionTaken}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Timeline (4 cols) */}
          <div className="col-span-4 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-3.5 border-b border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Document Timeline</p>
            </div>

            <div className="p-5 space-y-1">
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-gray-600">{doneCount} of {steps.length} steps complete</p>
                <p className={`text-[10px] font-bold ${status.color}`}>{progressPct}%</p>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-5">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>

              {/* Steps */}
              {steps.map(({ label, time, done }, i) => (
                <div key={label} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${done ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-gray-800/30 border border-white/[0.03]"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                    done ? "bg-emerald-500/20 border-emerald-500/40" : "bg-gray-800 border-white/5"
                  }`}>
                    {done
                      ? <FaCheck size={8} className="text-emerald-400" />
                      : <span className="text-gray-700 text-[10px] font-bold">{i + 1}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${done ? "text-white" : "text-gray-600"}`}>{label}</p>
                    {time
                      ? <p className="text-gray-500 text-[10px] mt-0.5">{fmtTime(time)}</p>
                      : <p className="text-gray-700 text-[10px] mt-0.5 italic">Not yet</p>
                    }
                  </div>
                  {done && i === doneCount - 1 && (
                    <div className="shrink-0">
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Latest</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE LAYOUT (unchanged)
      ════════════════════════════════════════ */}
      <div className="sm:hidden space-y-4">
        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-lg ${status.bg}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${status.dot} shrink-0`} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
            <p className="text-gray-500 text-xs mt-0.5">Current document status</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-white font-bold text-base leading-tight break-words">{record.documentTitle}</h2>
                {record.documentNumber && <p className="text-gray-500 text-xs mt-0.5">#{record.documentNumber}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${type.bg}`}>{type.label}</span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
            {[
              { label: "Submitted By",  value: record.personName },
              { label: "Category",      value: record.category },
              { label: "Document Date", value: fmt(record.documentDate) },
              { label: "Subject",       value: record.subject },
              { label: "From Office",   value: record.fromOffice },
              { label: "To Office",     value: record.toOffice },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-white text-sm break-words">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-white text-sm font-bold">Document Timeline</p>
          </div>
          <div className="p-5">
            {steps.map(({ label, time, done }, i) => (
              <TimelineStep key={label} label={label} time={time} done={done} isLast={i === steps.length - 1} />
            ))}
          </div>
        </div>

        {record.actionTaken && (
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Action Taken</p>
            <p className="text-white text-sm leading-relaxed">{record.actionTaken}</p>
          </div>
        )}

        <p className="text-center text-gray-700 text-[10px]">Last updated: {fmtTime(record.updatedAt)}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TrackRecordPage() {
  const [input,        setInput]        = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  const { data, isLoading, isError, error } = useTrackRecordQuery(trackingCode, {
    skip: !trackingCode,
  });

  const record = data?.data as TrackedRecord | undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = input.trim();
    if (!code) return;
    setTrackingCode(code);
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Track Document</h1>
          <p className="text-gray-500 text-xs mt-0.5">Enter tracking code to check document status</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <div className="relative flex-1 group">
          <FaBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" size={13} />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your tracking code..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap"
        >
          <FaSearch size={10} /> Track
        </button>
      </form>

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="space-y-3 ">
          {/* Table card skeleton */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="h-10 bg-gray-800/60 border-b border-white/5" />
            <div className="grid grid-cols-12 gap-4 px-6 py-5">
              <div className="col-span-1 flex justify-center"><div className="w-3 h-3 rounded-full bg-gray-800" /></div>
              <div className="col-span-4 space-y-2"><div className="h-4 bg-gray-800 rounded w-3/4" /><div className="h-3 bg-gray-800/60 rounded w-1/2" /></div>
              <div className="col-span-2"><div className="h-4 bg-gray-800 rounded w-2/3" /></div>
              <div className="col-span-2"><div className="h-5 bg-gray-800 rounded-full w-16" /></div>
              <div className="col-span-2"><div className="h-5 bg-gray-800 rounded-full w-16" /></div>
              <div className="col-span-1 space-y-1"><div className="h-2 bg-gray-800 rounded w-full" /></div>
            </div>
          </div>
          {/* Details + timeline skeleton */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="h-10 bg-gray-800/60 border-b border-white/5" />
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800/60 rounded-xl" />)}</div>
                <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800/60 rounded-xl" />)}</div>
              </div>
            </div>
            <div className="col-span-4 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
              <div className="h-10 bg-gray-800/60 border-b border-white/5" />
              <div className="p-5 space-y-3">
                <div className="h-1 bg-gray-800 rounded-full w-full" />
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-800/60 rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {isError && !isLoading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-xl">
          <FaTimesCircle size={14} className="text-red-400 shrink-0" />
          <div>
            <p className="text-red-300 text-sm font-semibold">Document not found</p>
            <p className="text-red-400/60 text-xs mt-0.5">
              {(error as any)?.data?.message ?? "Please check your tracking code and try again."}
            </p>
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {record && !isLoading && <TrackingResult record={record} />}

      {/* ── Help text (empty state) ── */}
      {!trackingCode && !isLoading && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
          {/* Column headers — mirrors Records table exactly */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
            <div className="col-span-5">Document</div>
            <div className="col-span-2">Person</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Progress</div>
          </div>

          {/* Empty state body */}
          <div className="py-16 text-center">
            <FaFileAlt size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-sm">No document loaded</p>
            <p className="text-gray-600 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              Enter your tracking code above to look up a document.
              Your code was provided when the document was submitted at the NBSC Student Affairs Office.
            </p>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <p className="text-center text-gray-700 text-[10px] uppercase tracking-widest">
        NBSC Student Affairs Office · Document Tracking
      </p>
    </div>
  );
}