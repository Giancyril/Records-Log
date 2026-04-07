import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetRecordsQuery,
  useDeleteRecordMutation,
  useBulkDeleteRecordsMutation,
  useArchiveRecordMutation,
  useBulkCreateRecordsMutation,
  useBulkReceiveRecordsMutation,
  useBulkReleaseRecordsMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaPlus, FaSearch, FaTrash, FaEye, FaFileAlt, FaTimes,
  FaCheckSquare, FaSquare, FaFilter, FaDownload, FaFileUpload,
  FaBox, FaInbox, FaShare,
} from "react-icons/fa";
import type { Record as Rec } from "../../types/types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import BulkActionModal from "../../components/records/BulkActionModal";

const TYPE_TABS = [
  { label: "All Records", value: "" },
  { label: "Incoming",    value: "INCOMING" },
  { label: "Outgoing",    value: "OUTGOING" },
];
const STATUS_TABS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "PENDING" },
  { label: "Received", value: "RECEIVED" },
  { label: "Released", value: "RELEASED" },
];

const TYPE_COLOR: Record<string, string> = {
  INCOMING: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  OUTGOING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  RECEIVED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  RELEASED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const exportCSV = (records: Rec[]) => {
  const headers = ["Title", "Number", "Type", "Status", "Person", "Department", "From Office", "To Office", "Document Date", "Created"];
  const rows = records.map(r => [
    r.documentTitle, r.documentNumber, r.type, r.status,
    r.personName, r.personDepartment, r.fromOffice, r.toOffice,
    fmt(r.documentDate), fmt(r.createdAt),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function RecordsPage() {
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [search,      setSearch]      = useState("");
  const [type,        setType]        = useState("");
  const [status,      setStatus]      = useState("");
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [bulkModal,   setBulkModal]   = useState<"receive" | "release" | null>(null);

  const [deleteRecord]                                   = useDeleteRecordMutation();
  const [bulkDelete,   { isLoading: bulkDeleting  }]    = useBulkDeleteRecordsMutation();
  const [archiveRecord]                                  = useArchiveRecordMutation();
  const [bulkCreate,   { isLoading: importing     }]    = useBulkCreateRecordsMutation();
  const [bulkReceive,  { isLoading: bulkReceiving }]    = useBulkReceiveRecordsMutation();
  const [bulkRelease,  { isLoading: bulkReleasing }]    = useBulkReleaseRecordsMutation();

  const { data, isLoading } = useGetRecordsQuery({
    search, type, status, page, limit: 12,
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo }),
  });

  const records = (data?.data ?? []) as Rec[];
  const meta    = data?.meta;

  const hasFilters         = !!(dateFrom || dateTo);
  const allOnPageSelected  = records.length > 0 && records.every(r => selected.has(r.id));
  const toggleSelect       = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll          = () => setSelected(prev => prev.size === records.length ? new Set() : new Set(records.map(r => r.id)));
  const clearSelection     = () => setSelected(new Set());

  const handleDelete = async (r: Rec) => {
    const ok = await confirm({ title: "Delete Record", message: `Delete "${r.documentTitle}"? This cannot be undone.`, confirmText: "Delete", variant: "danger" });
    if (!ok) return;
    try { await deleteRecord(r.id).unwrap(); toast.success("Record deleted"); }
    catch (err: any) { toast.error(err?.data?.message ?? "Failed to delete"); }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({ title: "Bulk Delete", message: `Delete ${selected.size} record(s)? This cannot be undone.`, confirmText: "Delete All", variant: "danger" });
    if (!ok) return;
    try {
      await bulkDelete({ ids: Array.from(selected) }).unwrap();
      toast.success(`${selected.size} record(s) deleted`);
      clearSelection();
    } catch (err: any) { toast.error(err?.data?.message ?? "Bulk delete failed"); }
  };

  const handleBulkReceive = async (formData: { receiverSignature: any; actionTaken: string; remarks: string }) => {
    try {
      const result: any = await bulkReceive({ ids: Array.from(selected), ...formData }).unwrap();
      toast.success(`${result.data?.received ?? selected.size} record(s) marked as received`);
      clearSelection();
      setBulkModal(null);
    } catch (err: any) { toast.error(err?.data?.message ?? "Bulk receive failed"); }
  };

  const handleBulkRelease = async (formData: { receiverSignature: any; actionTaken: string; remarks: string }) => {
    try {
      const result: any = await bulkRelease({ ids: Array.from(selected), ...formData }).unwrap();
      toast.success(`${result.data?.released ?? selected.size} record(s) marked as released`);
      clearSelection();
      setBulkModal(null);
    } catch (err: any) { toast.error(err?.data?.message ?? "Bulk release failed"); }
  };

  const handleArchive = async (r: Rec) => {
    const ok = await confirm({ title: "Archive Record", message: `Move "${r.documentTitle}" to archive?`, confirmText: "Archive", variant: "info" });
    if (!ok) return;
    try { await archiveRecord(r.id).unwrap(); toast.success("Record archived"); }
    catch (err: any) { toast.error(err?.data?.message ?? "Failed to archive"); }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text    = event.target?.result as string;
        const lines   = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) return toast.error("CSV is empty or invalid");
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const rows    = lines.slice(1);
        const recordsToCreate = rows.map(line => {
          const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const obj: any = {};
          headers.forEach((h, i) => {
            const val = values[i];
            if (h.toLowerCase() === "title")        obj.documentTitle    = val;
            if (h.toLowerCase() === "number")       obj.documentNumber   = val;
            if (h.toLowerCase() === "type")         obj.type             = val?.toUpperCase();
            if (h.toLowerCase() === "person")       obj.personName       = val;
            if (h.toLowerCase() === "email")        obj.personEmail      = val;
            if (h.toLowerCase() === "department")   obj.personDepartment = val;
            if (h.toLowerCase() === "position")     obj.personPosition   = val;
            if (h.toLowerCase() === "office from")  obj.fromOffice       = val;
            if (h.toLowerCase() === "office to")    obj.toOffice         = val;
            if (h.toLowerCase() === "subject")      obj.subject          = val;
            if (h.toLowerCase() === "particulars")  obj.particulars      = val;
            if (h.toLowerCase() === "category")     obj.category         = val;
            if (h.toLowerCase() === "date")         obj.documentDate     = val;
            if (h.toLowerCase() === "remarks")      obj.remarks          = val;
          });
          if (!obj.type)               obj.type              = "INCOMING";
          if (!obj.documentDate)       obj.documentDate      = new Date().toISOString();
          if (!obj.submitterSignature) obj.submitterSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
          return obj;
        }).filter(r => r.documentTitle && r.personName);
        if (recordsToCreate.length === 0) return toast.error("No valid records found in CSV");
        await bulkCreate(recordsToCreate).unwrap();
        toast.success(`Successfully imported ${recordsToCreate.length} records`);
      } catch (err: any) { toast.error(err?.data?.message ?? "Failed to import CSV"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <ConfirmDialog isOpen={isOpen} title={options.title} message={options.message}
        confirmText={options.confirmText} cancelText={options.cancelText}
        variant={options.variant} onConfirm={handleConfirm} onCancel={handleCancel} />

      {bulkModal === "receive" && (
        <BulkActionModal
          title="Bulk Receive" description="Mark selected records as received"
          actionLabel="Confirm Receive" count={selected.size}
          isLoading={bulkReceiving} onClose={() => setBulkModal(null)} onSubmit={handleBulkReceive}
        />
      )}
      {bulkModal === "release" && (
        <BulkActionModal
          title="Bulk Release" description="Mark selected records as released"
          actionLabel="Confirm Release" count={selected.size}
          isLoading={bulkReleasing} onClose={() => setBulkModal(null)} onSubmit={handleBulkRelease}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Records</h1>
          <p className="text-gray-500 text-xs mt-0.5">{meta?.total ?? 0} record{meta?.total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => exportCSV(records)}
            className="w-8 h-8 sm:w-auto sm:h-auto inline-flex items-center justify-center gap-1.5 sm:px-3 sm:py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-semibold rounded-xl transition-all"
            title="Export CSV">
            <FaDownload size={11} /><span className="hidden sm:inline">Export</span>
          </button>
          <label className="w-8 h-8 sm:w-auto sm:h-auto inline-flex items-center justify-center gap-1.5 sm:px-3 sm:py-2 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-300 text-xs font-semibold rounded-xl transition-all cursor-pointer" title="Import CSV">
            <FaFileUpload size={11} /><span className="hidden sm:inline">{importing ? "Importing..." : "Import"}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={importing} />
          </label>
          <button onClick={() => setShowFilters(f => !f)}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-xl border text-xs transition-all ${showFilters || hasFilters ? "bg-blue-600/20 border-blue-500/30 text-blue-400" : "bg-gray-800 hover:bg-gray-700 border-white/5 text-gray-300"}`}>
            <FaFilter size={10} />
          </button>
          <Link to="/records/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap">
            <FaPlus size={10} /> New Record
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date Range</p>
            {hasFilters && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">From</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">To</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-800 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/5 border border-blue-500/15 rounded-xl flex-wrap">
          <span className="text-blue-300 text-sm font-semibold shrink-0">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button onClick={() => setBulkModal("receive")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg transition-all">
              <FaInbox size={10} /> Receive
            </button>
            <button onClick={() => setBulkModal("release")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition-all">
              <FaShare size={10} /> Release
            </button>
            <button onClick={handleBulkDelete} disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all">
              <FaTrash size={10} /> {bulkDeleting ? "Deleting..." : "Delete"}
            </button>
            <button onClick={clearSelection}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <FaTimes size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex p-1 sm:p-1.5 bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-xl sm:rounded-2xl w-full shadow-2xl shadow-black/40">
        {TYPE_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setType(value); setPage(1); }}
            className={`relative flex-1 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-[12px] text-[10px] sm:text-[11px] uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center ${
              type === value
                ? "bg-blue-600 text-white shadow-lg ring-1 ring-white/10"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Status chips */}
      <div className="flex flex-col lg:flex-row gap-3 items-center w-full">
        <div className="relative w-full lg:flex-1 group">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={11} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search records..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-white/5 rounded-xl text-white text-xs sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
              <FaTimes size={10} />
            </button>
          )}
        </div>
        <div className="w-full lg:w-auto">
          <div className="flex gap-2 w-full lg:justify-end overflow-x-auto py-1">
            {STATUS_TABS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setStatus(value); setPage(1); }}
                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-200 border whitespace-nowrap flex items-center justify-center shrink-0 ${
                  status === value
                    ? "bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-gray-900/40 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-x-auto">

        {/* ── Desktop header: checkbox merged into Document col ── */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-600 font-semibold border-b border-white/5">
          <div className="col-span-5 flex items-center gap-3">
            <button onClick={toggleAll} className="text-gray-500 hover:text-white transition-colors shrink-0">
              {allOnPageSelected ? <FaCheckSquare size={13} className="text-blue-400" /> : <FaSquare size={13} />}
            </button>
            <span>Document</span>
          </div>
          <div className="col-span-2">Person</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-800/60 rounded-xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center">
            <FaFileAlt size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold text-sm">No records found</p>
            <p className="text-gray-600 text-xs mt-1">{search || type || status ? "Try adjusting your filters" : "Create your first record"}</p>
            {!search && !type && !status && (
              <Link to="/records/new" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all">
                <FaPlus size={10} /> New Record
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {records.map(r => (
              <div key={r.id} className={`group transition-colors ${selected.has(r.id) ? "bg-blue-500/5" : "hover:bg-white/[0.02]"}`}>

                {/* ── Desktop row: checkbox inline with document ── */}
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-5 py-3.5">
                  {/* Document + checkbox merged */}
                  <div className="col-span-5 flex items-start gap-3 min-w-0">
                    <button onClick={() => toggleSelect(r.id)} className="text-gray-500 hover:text-blue-400 transition-colors mt-0.5 shrink-0">
                      {selected.has(r.id) ? <FaCheckSquare size={13} className="text-blue-400" /> : <FaSquare size={13} />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{r.documentTitle}</p>
                      {r.documentNumber && <p className="text-gray-500 text-xs mt-0.5">#{r.documentNumber}</p>}
                      <p className="text-gray-600 text-xs">{fmt(r.documentDate)}</p>
                    </div>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{r.personName}</p>
                    {r.personDepartment && <p className="text-gray-600 text-xs truncate">{r.personDepartment}</p>}
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[r.type]}`}>{r.type}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                  <Link to={`/records/${r.id}`}
                      className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-colors">
                      <FaEye size={11} />
                    </Link>
                    <button onClick={() => handleArchive(r)}
                      className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors" title="Archive">
                      <FaBox size={11} />
                    </button>      
                    <button onClick={() => handleDelete(r)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                      <FaTrash size={10} />
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-3.5">
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggleSelect(r.id)} className="text-gray-500 hover:text-blue-400 mt-0.5 shrink-0">
                      {selected.has(r.id) ? <FaCheckSquare size={14} className="text-blue-400" /> : <FaSquare size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{r.documentTitle}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{r.personName}</p>
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[r.type]}`}>{r.type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Link to={`/records/${r.id}`} className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <FaEye size={12} />
                          </Link>
                          <button onClick={() => handleArchive(r)} className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <FaBox size={12} />
                          </button>                  
                          <button onClick={() => handleDelete(r)} className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
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
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">
            Prev
          </button>
          {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page ? "bg-blue-600 text-white" : "bg-gray-900 border border-white/5 text-gray-400 hover:text-white"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))} disabled={page === meta.totalPage}
            className="px-3 py-1.5 bg-gray-900 border border-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-40 hover:text-white transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}