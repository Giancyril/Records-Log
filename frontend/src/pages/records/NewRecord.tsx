import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { useCreateRecordMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaCheck, FaEraser } from "react-icons/fa";

const todayStr = () => new Date().toISOString().split("T")[0];
const steps = ["Doc Info", "Person", "Sign"];

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-0 mb-6">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i < current
                ? "bg-blue-600 border-blue-600 text-white"
                : i === current
                ? "bg-blue-600/15 border-blue-500 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-600"
            }`}
          >
            {i < current ? <FaCheck size={10} /> : i + 1}
          </div>
          <span
            className={`text-[9px] font-medium whitespace-nowrap ${
              i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`w-10 sm:w-16 h-px mx-1 mb-4 transition-all ${
              i < current ? "bg-blue-600" : "bg-gray-700"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

const inputCls =
  "w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

const CATEGORIES = [
  "Memorandum","Letter","Report","Request",
  "Certificate","Form","Notice","Other",
];

export default function NewRecord() {
  const navigate = useNavigate();
  const sigRef = useRef<SignatureCanvas>(null);

  const [step, setStep] = useState(0);
  const [sigDone, setSigDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    type: "INCOMING" as "INCOMING" | "OUTGOING",
    documentTitle: "",
    documentNumber: "",
    particulars: "",
    category: "",
    subject: "",
    fromOffice: "",
    toOffice: "",
    personName: "",
    personEmail: "",
    personDepartment: "",
    personPosition: "",
    documentDate: todayStr(),
    remarks: "",
  });

  const [createRecord, { isLoading }] = useCreateRecordMutation();
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.documentTitle.trim()) e.documentTitle = "Required";
      if (!form.documentDate) e.documentDate = "Required";
    }
    if (s === 1) {
      if (!form.personName.trim()) e.personName = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => s + 1); };
  const back = () => { setStep((s) => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    const submitterSignature = sigRef.current.toDataURL("image/png");
    try {
      const res: any = await createRecord({ ...form, submitterSignature }).unwrap();
      toast.success("Record created!");
      navigate(`/records/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create record");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-0 sm:px-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 px-1">

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">New Record</h1>
          <p className="text-gray-500 text-xs">Step {step + 1} of {steps.length}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 sm:p-6">
        <StepIndicator current={step} />

        {/* ── Step 0 — Document Info ── */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Record Type */}
            <div>
              <label className={labelCls}>Record Type *</label>
              <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                {(["INCOMING", "OUTGOING"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type", t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      form.type === t ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Title */}
            <div>
              <label className={labelCls}>Document Title *</label>
              <input
                value={form.documentTitle}
                onChange={(e) => set("documentTitle", e.target.value)}
                placeholder="e.g. Request for Leave of Absence"
                className={inputCls}
              />
              {errors.documentTitle && (
                <p className="text-red-400 text-xs mt-1">{errors.documentTitle}</p>
              )}
            </div>

            {/* Doc Number + Category — stack on very small screens */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Document Number</label>
                <input
                  value={form.documentNumber}
                  onChange={(e) => set("documentNumber", e.target.value)}
                  placeholder="e.g. 2026-001"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className={labelCls}>Subject</label>
              <input
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Brief subject of the document"
                className={inputCls}
              />
            </div>

            {/* Particulars */}
            <div>
              <label className={labelCls}>Particulars / Description</label>
              <textarea
                rows={2}
                value={form.particulars}
                onChange={(e) => set("particulars", e.target.value)}
                placeholder="Details about the document..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Document Date */}
            <div>
              <label className={labelCls}>Document Date *</label>
              <input
                type="date"
                value={form.documentDate}
                onChange={(e) => set("documentDate", e.target.value)}
                className={inputCls}
              />
              {errors.documentDate && (
                <p className="text-red-400 text-xs mt-1">{errors.documentDate}</p>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className={labelCls}>Remarks</label>
              <input
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="Any additional notes"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* ── Step 1 — Person & Office ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Person Name *</label>
              <input
                value={form.personName}
                onChange={(e) => set("personName", e.target.value)}
                placeholder="Juan dela Cruz"
                className={inputCls}
              />
              {errors.personName && (
                <p className="text-red-400 text-xs mt-1">{errors.personName}</p>
              )}
            </div>

            {/* Email + Position — stack on very small screens */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={form.personEmail}
                  onChange={(e) => set("personEmail", e.target.value)}
                  placeholder="juan@nbsc.edu.ph"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Position / Title</label>
                <input
                  value={form.personPosition}
                  onChange={(e) => set("personPosition", e.target.value)}
                  placeholder="e.g. Student, Faculty"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Department / Office</label>
              <input
                value={form.personDepartment}
                onChange={(e) => set("personDepartment", e.target.value)}
                placeholder=" "
                className={inputCls}
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Office Routing
              </p>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>From Office</label>
                  <input
                    value={form.fromOffice}
                    onChange={(e) => set("fromOffice", e.target.value)}
                    placeholder="e.g. Registrar's Office"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>To Office</label>
                  <input
                    value={form.toOffice}
                    onChange={(e) => set("toOffice", e.target.value)}
                    placeholder="e.g. Student Affairs Office"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 — Signature ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-800/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 shrink-0">Title</span>
                <span className="text-white font-medium text-right break-words min-w-0">
                  {form.documentTitle}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 shrink-0">Type</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    form.type === "INCOMING"
                      ? "bg-purple-500/15 text-purple-400 border-purple-500/20"
                      : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
                  }`}
                >
                  {form.type}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 shrink-0">Person</span>
                <span className="text-white font-medium truncate">{form.personName}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 shrink-0">Date</span>
                <span className="text-white font-medium">{form.documentDate}</span>
              </div>
            </div>

            {/* Signature pad */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelCls} mb-0`}>Submitter Signature *</label>
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
                  canvasProps={{
                    className: "sig-canvas w-full",
                    height: 160,
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

            {/* Disclaimer */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
              <p className="text-amber-300/80 text-xs leading-relaxed">
                By signing, the submitter confirms that the information provided is accurate and
                the document has been officially submitted.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className={`flex mt-6 gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}>
          {step > 0 && (
            <button
              onClick={back}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-all"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
            >
              Continue 
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !sigDone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
            >
              {isLoading ? "Saving..." : <> Save Record</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}