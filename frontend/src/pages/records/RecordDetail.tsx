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
  d
    ? new Date(d).toLocaleString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : "—";

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "—";

const TYPE_COLOR: Record<string, string> = {
  INCOMING: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  OUTGOING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  RECEIVED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  RELEASED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-white text-sm break-words">{value || "—"}</p>
  </div>
);

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";

function SignatureModal({
  title, actionLabel, onSubmit, onClose, isLoading,
}: {
  title: string;
  actionLabel: string;
  onSubmit: (data: { receiverSignature: any; actionTaken: string; remarks: string }) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [sigDone, setSigDone] = useState(false);
  const [action, setAction] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature.");
      return;
    }
    // ✅ Store compact JSON path data instead of base64 PNG
    const data = sigRef.current.toData();
    onSubmit({
      receiverSignature: data,
      actionTaken: action,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xs transition-colors">
            Cancel
          </button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Action Taken
            </label>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="What action was taken?"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Remarks
            </label>
            <input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional notes"
              className={inputCls}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Receiver Signature *
              </label>
              <button
                type="button"
                onClick={() => { sigRef.current?.clear(); setSigDone(false); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs"
              >
                <FaEraser size={10} /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800 touch-none">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "sig-canvas w-full",
                  height: 150,
                  style: { touchAction: "none" },
                }}
                backgroundColor="rgba(31,41,55,1)"
                penColor="white"
                onEnd={() => setSigDone(true)}
              />
            </div>
            <p className="text-gray-600 text-[10px] mt-1.5 text-center">
              Draw signature with finger or mouse
            </p>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/8 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !sigDone}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
          >
            {isLoading ? "Processing..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const handleReceive = async (formData: any) => {
    try {
      await receiveRecord({ id: id!, ...formData }).unwrap();
      toast.success("Record marked as received!");
      setShowReceiveModal(false);
    } catch (err: any) { toast.error(err?.data?.message ?? "Failed"); }
  };

  const handleRelease = async (formData: any) => {
    try {
      await releaseRecord({ id: id!, ...formData }).unwrap();
      toast.success("Record marked as released!");
      setShowReleaseModal(false);
    } catch (err: any) { toast.error(err?.data?.message ?? "Failed"); }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Record",
      message: `Delete "${record?.documentTitle}"? This cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteRecord(id!).unwrap();
      toast.success("Record deleted");
      navigate("/records");
    } catch (err: any) { toast.error(err?.data?.message ?? "Failed"); }
  };

  if (isLoading) return (
    <div className="max-w-2xl mx-auto w-full space-y-4 overflow-x-hidden">
      <div className="h-8 w-48 bg-gray-800 rounded-xl animate-pulse" />
      <div className="h-64 bg-gray-800 rounded-2xl animate-pulse" />
    </div>
  );

  if (!record) return (
    <div className="max-w-2xl mx-auto w-full text-center py-20 overflow-x-hidden">
      <p className="text-gray-400">Record not found.</p>
      <button onClick={() => navigate("/records")} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
        Go back
      </button>
    </div>
  );

  // ✅ Resolve signature display URLs once — handles both legacy base64 and new JSON path format
  const submitterSigUrl = signatureToDisplay(record.submitterSignature ?? "");
  const receiverSigUrl  = signatureToDisplay(record.receiverSignature  ?? "");

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 overflow-x-hidden">
      <ConfirmDialog
        isOpen={isOpen} title={options.title} message={options.message}
        confirmText={options.confirmText} cancelText={options.cancelText}
        variant={options.variant} onConfirm={handleConfirm} onCancel={handleCancel}
      />

      {showReceiveModal && (
        <SignatureModal
          title="Mark as Received" actionLabel="Confirm Received"
          onSubmit={handleReceive} onClose={() => setShowReceiveModal(false)} isLoading={receiving}
        />
      )}
      {showReleaseModal && (
        <SignatureModal
          title="Mark as Released" actionLabel="Confirm Released"
          onSubmit={handleRelease} onClose={() => setShowReleaseModal(false)} isLoading={releasing}
        />
      )}

      {/* ✅ Signature lightbox — uses resolved display URLs */}
      {showSig && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSig(null)}
        >
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 max-w-sm w-full">
            <p className="text-white text-sm font-bold mb-3">
              {showSig === "submitter" ? "Submitter" : "Receiver"} Signature
            </p>
            <img
              src={showSig === "submitter" ? submitterSigUrl : receiverSigUrl}
              alt="Signature"
              className="w-full rounded-xl bg-gray-800"
            />
            <button
              onClick={() => setShowSig(null)}
              className="mt-3 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLOR[record.type]}`}>
              {record.type}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[record.status]}`}>
              {record.status}
            </span>
          </div>
          <h1 className="text-white text-lg sm:text-xl font-bold leading-tight break-words">
            {record.documentTitle}
          </h1>
          {record.documentNumber && (
            <p className="text-gray-500 text-xs mt-0.5">#{record.documentNumber}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
          {record.status === "PENDING" && (
            <button
              onClick={() => setShowReceiveModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
            >
              <FaInbox size={11} /> Receive
            </button>
          )}
          {record.status === "RECEIVED" && (
            <button
              onClick={() => setShowReleaseModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 text-emerald-400 text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
            >
              <FaShare size={11} /> Release
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50 shrink-0"
          >
            <FaTrash size={11} />
          </button>
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Document Information</h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Document Date" value={fmtDate(record.documentDate)} />
          <Field label="Category"      value={record.category} />
          <Field label="Subject"       value={record.subject} />
          <Field label="From Office"   value={record.fromOffice} />
          <Field label="To Office"     value={record.toOffice} />
          <Field label="Processed By"  value={record.processedBy?.name || record.processedBy?.username} />
          {record.particulars && (
            <div className="col-span-2 min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Particulars</p>
              <p className="text-white text-sm leading-relaxed break-words">{record.particulars}</p>
            </div>
          )}
          {record.remarks && (
            <div className="col-span-2 min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Remarks</p>
              <p className="text-white text-sm leading-relaxed break-words">{record.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Person Info */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Person Information</h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Name"       value={record.personName} />
          <Field label="Email"      value={record.personEmail} />
          <Field label="Department" value={record.personDepartment} />
          <Field label="Position"   value={record.personPosition} />
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Status Timeline</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: "Created",  time: record.createdAt,  done: true },
            { label: "Received", time: record.receivedAt, done: !!record.receivedAt },
            { label: "Released", time: record.releasedAt, done: !!record.releasedAt },
          ].map(({ label, time, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                done
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-gray-800 border border-white/5"
              }`}>
                {done
                  ? <FaCheck size={9} className="text-emerald-400" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                }
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${done ? "text-white" : "text-gray-600"}`}>{label}</p>
                {time && <p className="text-gray-500 text-[10px]">{fmt(time)}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Taken */}
      {record.actionTaken && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Action Taken</p>
          <p className="text-white text-sm leading-relaxed break-words">{record.actionTaken}</p>
        </div>
      )}

      {/* Signatures — ✅ use resolved display URLs */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Signatures</h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Submitter</p>
            {submitterSigUrl ? (
              <button
                onClick={() => setShowSig("submitter")}
                className="w-full h-20 rounded-xl bg-gray-800 border border-white/5 overflow-hidden hover:border-blue-500/30 transition-colors"
              >
                <img src={submitterSigUrl} alt="Submitter sig" className="w-full h-full object-contain" />
              </button>
            ) : (
              <div className="w-full h-20 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center">
                <p className="text-gray-600 text-xs">No signature</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Receiver</p>
            {receiverSigUrl ? (
              <button
                onClick={() => setShowSig("receiver")}
                className="w-full h-20 rounded-xl bg-gray-800 border border-white/5 overflow-hidden hover:border-blue-500/30 transition-colors"
              >
                <img src={receiverSigUrl} alt="Receiver sig" className="w-full h-full object-contain" />
              </button>
            ) : (
              <div className="w-full h-20 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center">
                <p className="text-gray-600 text-xs">No signature yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <CommentsSection recordId={id!} />

      <div className="h-4" />
    </div>
  );
}