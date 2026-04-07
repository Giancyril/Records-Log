import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { useCreateRecordMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaCheck, FaEraser, FaArrowLeft } from "react-icons/fa";
import { getSignatureData } from "../../utils/signature";
import { inferCategorySuggestion } from "../../utils/smartTagging";

const todayStr = () => new Date().toISOString().split("T")[0];
const steps = ["Document", "Person & Office", "Sign & Submit"];

const CATEGORIES = [
  "Memorandum", "Letter", "Report", "Request",
  "Certificate", "Form", "Notice", "Other",
];

const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";
const labelCls =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

/* ── Two-col grid helper ── */
const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
);

/* ── Field wrapper ── */
const Field = ({
  label, required, error, children, full,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; full?: boolean;
}) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <label className={labelCls}>
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

/* ── Step indicator ── */
const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
            i < current  ? "bg-blue-600 border-blue-600 text-white"
            : i === current ? "bg-blue-600/10 border-blue-500 text-blue-400"
            : "bg-gray-800 border-white/8 text-gray-600"
          }`}>
            {i < current ? <FaCheck size={10} /> : i + 1}
          </div>
          <span className={`text-[10px] font-semibold whitespace-nowrap ${
            i === current ? "text-blue-400" : i < current ? "text-gray-400" : "text-gray-600"
          }`}>{label}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-12 sm:w-20 h-px mx-2 mb-5 transition-all ${i < current ? "bg-blue-600/50" : "bg-white/5"}`} />
        )}
      </div>
    ))}
  </div>
);

export default function NewRecord() {
  const navigate = useNavigate();
  const sigRef = useRef<SignatureCanvas>(null);

  const [step, setStep]     = useState(0);
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

  const suggestedCategory = useMemo(
    () => inferCategorySuggestion({
      documentTitle: form.documentTitle,
      subject: form.subject,
      particulars: form.particulars,
    }),
    [form.documentTitle, form.subject, form.particulars]
  );

  const [createRecord, { isLoading }] = useCreateRecordMutation();
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.documentTitle.trim()) e.documentTitle = "Document title is required";
      if (!form.documentDate)         e.documentDate  = "Date is required";
    }
    if (s === 1) {
      if (!form.personName.trim()) e.personName = "Person name is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature before submitting.");
      return;
    }
    const submitterSignature = getSignatureData(sigRef);
    const requestBody = {
      ...form,
      submitterSignature,
      category: form.category.trim() || suggestedCategory,
    };
    try {
      const res: any = await createRecord(requestBody).unwrap();
      toast.success("Record created!");
      navigate(`/records/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create record");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/records")}
          className="w-8 h-8 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors shrink-0">
          <FaArrowLeft size={10} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">New Record</h1>
          <p className="text-gray-500 text-xs">Step {step + 1} of {steps.length} — {steps[step]}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 sm:p-7">
        <StepIndicator current={step} />

        {/* ══ Step 0 — Document Info ══ */}
        {step === 0 && (
          <div className="space-y-4">

            {/* Type toggle */}
            <div>
              <label className={labelCls}>Record Type</label>
              <div className="flex gap-1 p-1 bg-gray-800 rounded-xl">
                {(["INCOMING", "OUTGOING"] as const).map(t => (
                  <button key={t} type="button" onClick={() => set("type", t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      form.type === t ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title — full width */}
            <Field label="Document Title" required error={errors.documentTitle}>
              <input value={form.documentTitle} onChange={e => set("documentTitle", e.target.value)}
                placeholder="e.g. Request for Leave of Absence" className={inputCls} />
            </Field>

            {/* Row: Doc # + Category */}
            <Grid>
              <Field label="Document Number">
                <input value={form.documentNumber} onChange={e => set("documentNumber", e.target.value)}
                  placeholder="e.g. 2026-001" className={inputCls} />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  className={`${inputCls} appearance-none`}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {!form.category && suggestedCategory && (
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                    <span>Suggested: <strong className="text-white">{suggestedCategory}</strong></span>
                    <button type="button" onClick={() => set("category", suggestedCategory)}
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-semibold">
                      Use suggestion
                    </button>
                  </div>
                )}
              </Field>
            </Grid>

            {/* Row: Subject + Date */}
            <Grid>
              <Field label="Subject">
                <input value={form.subject} onChange={e => set("subject", e.target.value)}
                  placeholder="Brief subject" className={inputCls} />
              </Field>
              <Field label="Document Date" required error={errors.documentDate}>
                <input type="date" value={form.documentDate} onChange={e => set("documentDate", e.target.value)}
                  className={inputCls} />
              </Field>
            </Grid>

            {/* Particulars — full width */}
            <Field label="Particulars / Description">
              <textarea rows={2} value={form.particulars} onChange={e => set("particulars", e.target.value)}
                placeholder="Details about the document..." className={`${inputCls} resize-none`} />
            </Field>

            {/* Remarks — full width */}
            <Field label="Remarks">
              <input value={form.remarks} onChange={e => set("remarks", e.target.value)}
                placeholder="Any additional notes" className={inputCls} />
            </Field>

          </div>
        )}

        {/* ══ Step 1 — Person & Office ══ */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Person Name — full width */}
            <Field label="Person Name" required error={errors.personName}>
              <input value={form.personName} onChange={e => set("personName", e.target.value)}
                placeholder=" " className={inputCls} />
            </Field>

            {/* Row: Email + Position */}
            <Grid>
              <Field label="Email">
                <input type="email" value={form.personEmail} onChange={e => set("personEmail", e.target.value)}
                  placeholder=" " className={inputCls} />
              </Field>
              <Field label="Position / Title">
                <input value={form.personPosition} onChange={e => set("personPosition", e.target.value)}
                  placeholder="e.g. Student, Faculty" className={inputCls} />
              </Field>
            </Grid>

            {/* Department — full width */}
            <Field label="Department / Section">
              <input value={form.personDepartment} onChange={e => set("personDepartment", e.target.value)}
                placeholder="e.g. College of Engineering" className={inputCls} />
            </Field>

            {/* Divider */}
            <div className="border-t border-white/5 pt-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Office Routing</p>
              <Grid>
                <Field label="From Office">
                  <input value={form.fromOffice} onChange={e => set("fromOffice", e.target.value)}
                    placeholder="e.g. Registrar's Office" className={inputCls} />
                </Field>
                <Field label="To Office">
                  <input value={form.toOffice} onChange={e => set("toOffice", e.target.value)}
                    placeholder="e.g. Student Affairs" className={inputCls} />
                </Field>
              </Grid>
            </div>

          </div>
        )}

        {/* ══ Step 2 — Review & Sign ══ */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Summary */}
            <div className="bg-gray-800/50 border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Review</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Title",       value: form.documentTitle },
                  { label: "Type",        value: form.type },
                  { label: "Category",    value: form.category || "—" },
                  { label: "Date",        value: form.documentDate },
                  { label: "Person",      value: form.personName },
                  { label: "Department",  value: form.personDepartment || "—" },
                  { label: "From",        value: form.fromOffice || "—" },
                  { label: "To",          value: form.toOffice || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 px-4 py-2">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest shrink-0 pt-px">{label}</span>
                    <span className="text-sm text-white text-right break-words">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelCls} mb-0`}>
                  Submitter Signature <span className="text-red-400">*</span>
                </label>
                <button type="button" onClick={() => { sigRef.current?.clear(); setSigDone(false); }}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors">
                  <FaEraser size={10} /> Clear
                </button>
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-xl overflow-hidden bg-gray-800 touch-none">
                <SignatureCanvas ref={sigRef}
                  canvasProps={{ className: "sig-canvas w-full", height: 160, style: { touchAction: "none" } }}
                  backgroundColor="rgba(31,41,55,1)" penColor="white" onEnd={() => setSigDone(true)} />
              </div>
              <p className="text-gray-600 text-[10px] mt-1.5 text-center">Draw with finger or mouse</p>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
              <p className="text-amber-300/70 text-xs leading-relaxed">
                By signing, you confirm that all information provided is accurate and the document has been officially submitted.
              </p>
            </div>

          </div>
        )}

        {/* Navigation */}
        <div className={`flex mt-6 gap-3 ${step > 0 ? "justify-between" : "justify-end"}`}>
          {step > 0 && (
            <button onClick={back}
              className="px-4 py-2.5 rounded-xl border border-white/8 text-gray-400 hover:text-white hover:bg-gray-800 text-sm font-medium transition-all">
              Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={next}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading || !sigDone}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all">
              {isLoading ? "Saving..." : "Save Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}