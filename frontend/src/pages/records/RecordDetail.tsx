import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  useGetSingleRecordQuery,
  useReceiveRecordMutation,
  useReleaseRecordMutation,
  useDeleteRecordMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import {
  FaEraser, FaCheck, FaTrash, FaInbox, FaShare, 
} from "react-icons/fa";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import CommentsSection from "../../components/records/CommentsSection";
import { signatureToDisplay } from "../../utils/signature";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) : "—";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  }) : "—";

const TYPE_COLOR: Record<string, string> = {
  INCOMING: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  OUTGOING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  RECEIVED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  RELEASED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";

/* ── Single detail row ── */
const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest shrink-0 pt-px leading-relaxed">{label}</span>
    <span className="text-sm text-white text-right break-words">{value || "—"}</span>
  </div>
);

/* ── Card with header ── */
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
    <div className="px-5 py-3 border-b border-white/5">
      <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

/* ── Signature modal ── */
function SignatureModal({
  title, actionLabel, onSubmit, onClose, isLoading,
}: {
  title: string; actionLabel: string;
  onSubmit: (d: { receiverSignature: any; actionTaken: string; remarks: string }) => void;
  onClose: () => void; isLoading: boolean;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [sigDone, setSigDone] = useState(false);
  const [action, setAction]   = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) { toast.error("Please draw your signature."); return; }
    onSubmit({ receiverSignature: sigRef.current.toData(), actionTaken: action, remarks });
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Action Taken</label>
            <input value={action} onChange={e => setAction(e.target.value)} placeholder="What action was taken?" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes" className={inputCls} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signature *</label>
              <button type="button" onClick={() => { sigRef.current?.clear(); setSigDone(false); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs">
                <FaEraser size={10} /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800 touch-none">
              <SignatureCanvas ref={sigRef}
                canvasProps={{ className: "sig-canvas w-full", height: 150, style: { touchAction: "none" } }}
                backgroundColor="rgba(31,41,55,1)" penColor="white" onEnd={() => setSigDone(true)} />
            </div>
            <p className="text-gray-600 text-[10px] mt-1.5 text-center">Draw with finger or mouse</p>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5 pt-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/8 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading || !sigDone}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
            {isLoading ? "Processing..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showSig, setShowSig] = useState<"submitter" | "receiver" | null>(null);

  const { data, isLoading }                       = useGetSingleRecordQuery(id!);
  const [receiveRecord, { isLoading: receiving }] = useReceiveRecordMutation();
  const [releaseRecord, { isLoading: releasing }] = useReleaseRecordMutation();
  const [deleteRecord,  { isLoading: deleting }]  = useDeleteRecordMutation();

  const record = data?.data;

  const handleReceive = async (d: any) => {
    try { await receiveRecord({ id: id!, ...d }).unwrap(); toast.success("Marked as received!"); setShowReceiveModal(false); }
    catch (e: any) { toast.error(e?.data?.message ?? "Failed"); }
  };
  const handleRelease = async (d: any) => {
    try { await releaseRecord({ id: id!, ...d }).unwrap(); toast.success("Marked as released!"); setShowReleaseModal(false); }
    catch (e: any) { toast.error(e?.data?.message ?? "Failed"); }
  };
  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete Record", message: `Delete "${record?.documentTitle}"? This cannot be undone.`, confirmText: "Delete", variant: "danger" });
    if (!ok) return;
    try { await deleteRecord(id!).unwrap(); toast.success("Record deleted"); navigate("/records"); }
    catch (e: any) { toast.error(e?.data?.message ?? "Failed"); }
  };

  /* Loading */
  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-5 w-28 bg-gray-800 rounded animate-pulse" />
      <div className="h-20 bg-gray-900 border border-white/5 rounded-2xl animate-pulse" />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px] items-start">
        <div className="space-y-4">
          {[160, 120, 100].map(h => <div key={h} style={{ height: h }} className="bg-gray-900 border border-white/5 rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-4">
          {[180, 110, 140].map(h => <div key={h} style={{ height: h }} className="bg-gray-900 border border-white/5 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  if (!record) return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-sm">Record not found.</p>
      <button onClick={() => navigate("/records")} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">Go back</button>
    </div>
  );

  const submitterSigUrl = signatureToDisplay(record.submitterSignature ?? "");
  const receiverSigUrl  = signatureToDisplay(record.receiverSignature  ?? "");

  const steps = [
    { label: "Created",  time: record.createdAt,  done: true },
    { label: "Received", time: record.receivedAt, done: !!record.receivedAt },
    { label: "Released", time: record.releasedAt, done: !!record.releasedAt },
  ];

  return (
    <div className="space-y-4">
      <ConfirmDialog isOpen={isOpen} title={options.title} message={options.message}
        confirmText={options.confirmText} cancelText={options.cancelText}
        variant={options.variant} onConfirm={handleConfirm} onCancel={handleCancel} />

      {showReceiveModal && <SignatureModal title="Mark as Received" actionLabel="Confirm Received" onSubmit={handleReceive} onClose={() => setShowReceiveModal(false)} isLoading={receiving} />}
      {showReleaseModal && <SignatureModal title="Mark as Released" actionLabel="Confirm Released" onSubmit={handleRelease} onClose={() => setShowReleaseModal(false)} isLoading={releasing} />}

      {/* Signature lightbox */}
      {showSig && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowSig(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              {showSig === "submitter" ? "Submitter" : "Receiver"} Signature
            </p>
            <img src={showSig === "submitter" ? submitterSigUrl : receiverSigUrl} alt="Signature" className="w-full rounded-xl bg-gray-800" />
            <button onClick={() => setShowSig(null)} className="mt-3 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-xl transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Header — no card, bare on page ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[record.type]}`}>{record.type}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[record.status]}`}>{record.status}</span>
          </div>
          <h1 className="text-white text-lg font-bold leading-snug break-words">{record.documentTitle}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-0.5 text-[11px] text-gray-500">
            {record.documentNumber && <span>#{record.documentNumber}</span>}
            {record.documentDate   && <span>{fmtDate(record.documentDate)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {record.status === "PENDING" && (
            <button onClick={() => setShowReceiveModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-xs font-semibold rounded-xl transition-all">
              <FaInbox size={10} /><span className="hidden sm:inline">Receive</span>
            </button>
          )}
          {record.status === "RECEIVED" && (
            <button onClick={() => setShowReleaseModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 text-emerald-400 text-xs font-semibold rounded-xl transition-all">
              <FaShare size={10} /><span className="hidden sm:inline">Release</span>
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting}
            className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50">
            <FaTrash size={10} />
          </button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px] items-stretch">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Document details */}
          <Card title="Document Details">
            <Row label="Subject"      value={record.subject} />
            <Row label="From Office"  value={record.fromOffice} />
            <Row label="To Office"    value={record.toOffice} />
            <Row label="Processed By" value={record.processedBy?.name || record.processedBy?.username} />
            {record.particulars && <Row label="Particulars" value={record.particulars} />}
            {record.remarks     && <Row label="Remarks"     value={record.remarks} />}
            {record.actionTaken && <Row label="Action Taken" value={record.actionTaken} />}
          </Card>

          {/* Timeline — horizontal stepper */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status Timeline</h2>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-start">
                {steps.map(({ label, time, done }, i) => (
                  <div key={label} className="flex-1 flex flex-col items-center relative">
                    {i < steps.length - 1 && (
                      <div className={`absolute top-[11px] left-1/2 w-full h-px ${done && steps[i + 1].done ? "bg-emerald-500/30" : "bg-white/5"}`} />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${
                      done ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-gray-800 border border-white/8"
                    }`}>
                      {done ? <FaCheck size={8} className="text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />}
                    </div>
                    <div className="mt-2 text-center px-2">
                      <p className={`text-xs font-semibold ${done ? "text-white" : "text-gray-600"}`}>{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                        {time ? fmt(time) : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comments */}
          <CommentsSection recordId={id!} />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-4">

          {/* Summary */}
          <Card title="Summary">
            <Row label="Status"  value={record.status} />
            <Row label="Type"    value={record.type} />
            <Row label="Doc #"   value={record.documentNumber} />
            <Row label="Date"    value={fmtDate(record.documentDate)} />
            <Row label="By"      value={record.processedBy?.name || record.processedBy?.username} />
            <Row label="From"    value={record.fromOffice} />
            <Row label="To"      value={record.toOffice} />
            {record.subject      && <Row label="Subject"   value={record.subject} />}
            {record.category     && <Row label="Category"  value={record.category} />}
          </Card>

          {/* Person — grows to fill remaining sidebar height */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex-1 flex flex-col">
            <div className="px-5 py-3 border-b border-white/5 shrink-0">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Submitted By</h2>
            </div>
            <div className="px-5 py-1 flex-1">
              <Row label="Name"       value={record.personName} />
              <Row label="Email"      value={record.personEmail} />
              <Row label="Department" value={record.personDepartment} />
              <Row label="Position"   value={record.personPosition} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Signatures — full width below grid, side by side ── */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Signatures</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {([
            { key: "submitter" as const, label: "Submitter", url: submitterSigUrl, empty: "No signature" },
            { key: "receiver"  as const, label: "Receiver",  url: receiverSigUrl,  empty: "Awaiting receiver" },
          ]).map(({ key, label, url, empty }) => (
            <div key={key}>
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">{label}</p>
              {url ? (
                <button onClick={() => setShowSig(key)}
                  className="w-full h-20 rounded-xl bg-gray-800 border border-white/8 overflow-hidden hover:border-blue-500/25 transition-colors">
                  <img src={url} alt={`${label} sig`} className="w-full h-full object-contain" />
                </button>
              ) : (
                <div className="w-full h-20 rounded-xl bg-gray-800/40 border border-dashed border-white/8 flex items-center justify-center">
                  <p className="text-gray-700 text-[11px]">{empty}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}