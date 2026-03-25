import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetRecordsQuery, useUnarchiveRecordMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaSearch, FaEye, FaFileAlt, FaTimes,
  FaCheckSquare, FaSquare, FaUndo
} from "react-icons/fa";
import type { Record as Rec } from "../../types/types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";

const STATUS_TABS = [{ label: "All", value: "" }, { label: "Pending", value: "PENDING" }, { label: "Received", value: "RECEIVED" }, { label: "Released", value: "RELEASED" }];

const TYPE_COLOR: Record<string, string> = {
  INCOMING: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  OUTGOING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  RECEIVED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  RELEASED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function ArchivePage() {
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [unarchiveRecord] = useUnarchiveRecordMutation();

  const { data, isLoading } = useGetRecordsQuery({
    search, status, page, limit: 12, isArchived: "true"
  });

  const records = (data?.data ?? []) as Rec[];
  const meta = data?.meta;

  const allOnPageSelected = records.length > 0 && records.every(r => selected.has(r.id));
  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === records.length ? new Set() : new Set(records.map(r => r.id)));

  const handleUnarchive = async (r: Rec) => {
    const ok = await confirm({ title: "Unarchive Record", message: `Restore "${r.documentTitle}" to active records?`, confirmText: "Restore", variant: "info" });
    if (!ok) return;
    try { await unarchiveRecord(r.id).unwrap(); toast.success("Record restored"); }
    catch (err: any) { toast.error(err?.data?.message ?? "Failed to restore"); }
  };

  return (
    <div className="space-y-5">
      <ConfirmDialog isOpen={isOpen} title={options.title} message={options.message}
        confirmText={options.confirmText} cancelText={options.cancelText}
        variant={options.variant} onConfirm={handleConfirm} onCancel={handleCancel} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Archived Records</h1>
          <p className="text-gray-500 text-xs mt-0.5">{meta?.total ?? 0} record{meta?.total !== 1 ? "s" : ""} in archive</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={12} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search archived records..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
          {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><FaTimes size={11} /></button>}
        </div>

        <div className="flex gap-1.5 w-full py-1">
          {STATUS_TABS.map(({ label, value }) => (
            <button key={value} onClick={() => { setStatus(value); setPage(1); }}
              className={`flex-1 min-w-0 px-1 sm:px-3 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center whitespace-nowrap shrink ${status === value ? "bg-blue-600 border-blue-500/30 text-white" : "bg-gray-900 border-white/5 text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-x-auto">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
          <div className="col-span-1 flex items-center">
            <button onClick={toggleAll} className="text-gray-500 hover:text-white transition-colors">
              {allOnPageSelected ? <FaCheckSquare size={14} className="text-blue-400" /> : <FaSquare size={14} />}
            </button>
          </div>
          <div className="col-span-4">Document</div>
          <div className="col-span-2">Person</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-800/60 rounded-xl animate-pulse" />)}</div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center">
            <FaFileAlt size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-sm">Empty archive</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {records.map(r => (
              <div key={r.id} className={`group transition-colors ${selected.has(r.id) ? "bg-blue-500/5" : "hover:bg-white/[0.02]"}`}>
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5">
                  <div className="col-span-1">
                    <button onClick={() => toggleSelect(r.id)} className="text-gray-500 hover:text-blue-400 transition-colors">
                      {selected.has(r.id) ? <FaCheckSquare size={14} className="text-blue-400" /> : <FaSquare size={14} />}
                    </button>
                  </div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.documentTitle}</p>
                    {r.documentNumber && <p className="text-gray-500 text-xs mt-0.5">#{r.documentNumber}</p>}
                    <p className="text-gray-600 text-xs">{fmt(r.documentDate)}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{r.personName}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[r.type]}`}>{r.type}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    <button onClick={() => handleUnarchive(r)}
                      className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors"
                      title="Restore">
                      <FaUndo size={11} />
                    </button>
                    <Link to={`/records/${r.id}`}
                      className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors">
                      <FaEye size={11} />
                    </Link>
                  </div>
                </div>
                {/* Mobile */}
                <div className="sm:hidden px-4 py-3.5">
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggleSelect(r.id)} className="text-gray-500 mt-0.5 shrink-0">
                      {selected.has(r.id) ? <FaCheckSquare size={14} className="text-blue-400" /> : <FaSquare size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{r.documentTitle}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[r.type]}`}>{r.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-col">
                      <button onClick={() => handleUnarchive(r)} className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FaUndo size={12} />
                      </button>
                      <Link to={`/records/${r.id}`} className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <FaEye size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPage > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">Prev</button>
          {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page ? "bg-blue-600 text-white" : "bg-gray-900 border border-white/5 text-gray-400 hover:text-white"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))} disabled={page === meta.totalPage}
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
