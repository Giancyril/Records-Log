import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { FaEraser } from "react-icons/fa";
import { toast } from "react-toastify";

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";

interface BulkActionModalProps {
  title:       string;
  description: string;
  actionLabel: string;
  count:       number;
  isLoading:   boolean;
  onClose:     () => void;
  onSubmit:    (data: { receiverSignature: any; actionTaken: string; remarks: string }) => void;
}

export default function BulkActionModal({
  title, description, actionLabel, count, isLoading, onClose, onSubmit,
}: BulkActionModalProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [sigDone,  setSigDone]  = useState(false);
  const [action,   setAction]   = useState("");
  const [remarks,  setRemarks]  = useState("");

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

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{count} record{count !== 1 ? "s" : ""} selected · {description}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xs transition-colors">
            Cancel
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Action Taken
            </label>
            <input
              value={action}
              onChange={e => setAction(e.target.value)}
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
              onChange={e => setRemarks(e.target.value)}
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
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                <FaEraser size={10} /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800 touch-none">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{ className: "sig-canvas w-full", height: 150, style: { touchAction: "none" } }}
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

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all"
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