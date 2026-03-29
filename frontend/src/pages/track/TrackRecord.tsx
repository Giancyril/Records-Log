import { useState } from "react";
import { useTrackRecordQuery } from "../../redux/api/api";
import { FaSearch, FaCheck, FaClock } from "react-icons/fa";
import type { TrackedRecord } from "../../types/types";

const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   dot: "bg-amber-400" },
  RECEIVED: { label: "Received", color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",     dot: "bg-blue-400" },
  RELEASED: { label: "Released", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
};

const TYPE_CONFIG = {
  INCOMING: { label: "Incoming", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  OUTGOING: { label: "Outgoing", color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : null;

const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : null;

function TrackingResult({ record }: { record: TrackedRecord }) {
  const status = STATUS_CONFIG[record.status];
  const type   = TYPE_CONFIG[record.type];

  const steps = [
    { label: "Submitted",  time: record.createdAt,  done: true },
    { label: "Received",   time: record.receivedAt,  done: !!record.receivedAt },
    { label: "Released",   time: record.releasedAt,  done: !!record.releasedAt },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Status banner */}
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${status.bg}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${status.dot} shrink-0`} />
        <div>
          <p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
          <p className="text-gray-500 text-xs mt-0.5">Current document status</p>
        </div>
      </div>

      {/* Document info */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-white font-bold text-base leading-tight break-words">{record.documentTitle}</h2>
              {record.documentNumber && (
                <p className="text-gray-500 text-xs mt-0.5">#{record.documentNumber}</p>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${type.bg} ${type.color}`}>
              {type.label}
            </span>
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
          {[
            { label: "Submitted By",  value: record.personName },
            { label: "Category",      value: record.category || "—" },
            { label: "Document Date", value: fmt(record.documentDate) },
            { label: "Subject",       value: record.subject || "—" },
            { label: "From Office",   value: record.fromOffice || "—" },
            { label: "To Office",     value: record.toOffice || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
              <p className="text-white text-sm break-words">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white text-sm font-bold">Document Timeline</h3>
        </div>
        <div className="p-5 space-y-4">
          {steps.map(({ label, time, done }, i) => (
            <div key={label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  done ? "bg-emerald-500/20 border-emerald-500/30" : "bg-gray-800 border-white/5"
                }`}>
                  {done
                    ? <FaCheck size={9} className="text-emerald-400" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  }
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-px flex-1 mt-1 ${done ? "bg-emerald-500/30" : "bg-white/5"}`} style={{ minHeight: 16 }} />
                )}
              </div>
              <div className="pb-4 min-w-0">
                <p className={`text-xs font-semibold ${done ? "text-white" : "text-gray-600"}`}>{label}</p>
                {time && <p className="text-gray-500 text-[10px] mt-0.5">{fmtTime(time)}</p>}
                {!done && <p className="text-gray-700 text-[10px] mt-0.5">Pending</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action taken */}
      {record.actionTaken && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Action Taken</p>
          <p className="text-white text-sm leading-relaxed">{record.actionTaken}</p>
        </div>
      )}

      <p className="text-center text-gray-700 text-[10px]">
        Last updated: {fmtTime(record.updatedAt)}
      </p>
    </div>
  );
}

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
    <section className="flex flex-col items-center justify-start py-6 px-4">

      <div className="w-full max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          
          <h1 className="text-white text-2xl font-bold tracking-tight">Track Your Document</h1>
          <p className="text-gray-500 text-sm mt-1.5 max-w-sm mx-auto">
            Enter your tracking code to check the current status of your submitted document.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 group">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={11} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. clx1a2b3c4d5e6f7g8h9..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-lg shadow-blue-500/10">
            Track
          </button>
        </form>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 bg-gray-800 rounded-2xl" />
            <div className="h-48 bg-gray-800 rounded-2xl" />
            <div className="h-36 bg-gray-800 rounded-2xl" />
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex items-center gap-3 px-4 py-4 bg-red-500/8 border border-red-500/20 rounded-2xl">
            <FaClock size={16} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 text-sm font-semibold">Document not found</p>
              <p className="text-red-400/60 text-xs mt-0.5">
                {(error as any)?.data?.message ?? "Please check your tracking code and try again."}
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {record && !isLoading && <TrackingResult record={record} />}

        {/* Help text */}
        {!trackingCode && (
          <div className="bg-gray-900/50 border border-white/5 rounded-2xl px-5 py-4 text-center">
            <p className="text-gray-500 text-xs leading-relaxed">
              Your tracking code was provided when your document was submitted at the SASDD Office.
            </p>
          </div>
        )}

        <p className="text-center text-gray-700 text-[10px] uppercase tracking-widest">
          NBSC Student Affairs Office · Document Tracking
        </p>
      </div>
    </section>
  );
}