import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  useCreateRecordMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
} from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaCheck, FaEraser,  FaLayerGroup, FaTrash, FaSave } from "react-icons/fa";
import { getSignatureData } from "../../utils/signature";
import { inferCategorySuggestion } from "../../utils/smartTagging";
import type { RecordTemplate } from "../../types/types";

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

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
);

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

// ── Template drawer ───────────────────────────────────────────────────────────
function TemplateDrawer({
  onApply, onClose,
}: {
  onApply: (t: RecordTemplate) => void;
  onClose: () => void;
}) {
  const { data, isLoading }               = useGetTemplatesQuery(undefined);
  const [deleteTemplate, { isLoading: deleting }] = useDeleteTemplateMutation();
  const templates: RecordTemplate[]       = data?.data ?? [];

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await deleteTemplate(id).unwrap();
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <FaLayerGroup size={12} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">Use a Template</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          )}
          {!isLoading && templates.length === 0 && (
            <div className="text-center py-10">
              <FaLayerGroup size={24} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No templates yet.</p>
              <p className="text-gray-600 text-xs mt-1">Fill out the form and save it as a template.</p>
            </div>
          )}
          {templates.map(t => (
            <button key={t.id} onClick={() => onApply(t)}
              className="w-full text-left p-4 bg-gray-800/60 hover:bg-gray-800 border border-white/5 hover:border-white/10 rounded-xl transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      t.type === "INCOMING"
                        ? "bg-purple-500/15 text-purple-400 border-purple-500/20"
                        : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
                    }`}>{t.type}</span>
                    {t.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 border border-white/5">
                        {t.category}
                      </span>
                    )}
                    {t.fromOffice && (
                      <span className="text-[10px] text-gray-500 truncate max-w-[140px]">
                        {t.fromOffice} → {t.toOffice || "—"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(t.id, t.name, e)}
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all shrink-0"
                >
                  <FaTrash size={9} />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Save template modal ───────────────────────────────────────────────────────
function SaveTemplateModal({
  onSave, onClose, isLoading,
}: {
  onSave: (name: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Save as Template</h3>
        <p className="text-xs text-gray-500 mb-4">Give this template a name so you can reuse it later.</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim())}
          placeholder="e.g. Student Leave Request"
          className={inputCls}
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-white/8 text-gray-400 hover:text-white text-xs font-medium rounded-xl transition-all">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={isLoading || !name.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
            {isLoading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewRecord() {
  const navigate = useNavigate();
  const sigRef   = useRef<SignatureCanvas>(null);

  const [step, setStep]       = useState(0);
  const [sigDone, setSigDone] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates]       = useState(false);
  const [showSaveModal, setShowSaveModal]       = useState(false);

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

  const [createRecord,   { isLoading }]          = useCreateRecordMutation();
  const [createTemplate, { isLoading: saving }]  = useCreateTemplateMutation();

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const applyTemplate = (t: RecordTemplate) => {
    setForm(f => ({
      ...f,
      type:             t.type as "INCOMING" | "OUTGOING",
      documentTitle:    t.documentTitle,
      documentNumber:   t.documentNumber,
      particulars:      t.particulars,
      category:         t.category,
      subject:          t.subject,
      fromOffice:       t.fromOffice,
      toOffice:         t.toOffice,
      personName:       t.personName,
      personEmail:      t.personEmail,
      personDepartment: t.personDepartment,
      personPosition:   t.personPosition,
      remarks:          t.remarks,
    }));
    setShowTemplates(false);
    toast.success(`Template "${t.name}" applied`);
  };

  const handleSaveTemplate = async (name: string) => {
    try {
      await createTemplate({ name, ...form }).unwrap();
      toast.success(`Template "${name}" saved`);
      setShowSaveModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save template");
    }
  };

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
      {showTemplates && (
        <TemplateDrawer onApply={applyTemplate} onClose={() => setShowTemplates(false)} />
      )}
      {showSaveModal && (
        <SaveTemplateModal
          onSave={handleSaveTemplate}
          onClose={() => setShowSaveModal(false)}
          isLoading={saving}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
      
          <div>
            <h1 className="text-lg font-bold text-white">New Record</h1>
            <p className="text-gray-500 text-xs">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/8 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
          >
            <FaSave size={10} /> Save as Template
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-400 text-xs font-semibold rounded-xl transition-all"
          >
            <FaLayerGroup size={10} /> Use Template
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-white/5 rounded-2xl p-5 sm:p-7">
        <StepIndicator current={step} />

        {/* ══ Step 0 — Document Info ══ */}
        {step === 0 && (
          <div className="space-y-4">
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

            <Field label="Document Title" required error={errors.documentTitle}>
              <input value={form.documentTitle} onChange={e => set("documentTitle", e.target.value)}
                placeholder="e.g. Request for Leave of Absence" className={inputCls} />
            </Field>

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

            <Field label="Particulars / Description">
              <textarea rows={2} value={form.particulars} onChange={e => set("particulars", e.target.value)}
                placeholder="Details about the document..." className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Remarks">
              <input value={form.remarks} onChange={e => set("remarks", e.target.value)}
                placeholder="Any additional notes" className={inputCls} />
            </Field>
          </div>
        )}

        {/* ══ Step 1 — Person & Office ══ */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Person Name" required error={errors.personName}>
              <input value={form.personName} onChange={e => set("personName", e.target.value)}
                placeholder=" " className={inputCls} />
            </Field>

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

            <Field label="Department / Section">
              <input value={form.personDepartment} onChange={e => set("personDepartment", e.target.value)}
                placeholder="e.g. College of Engineering" className={inputCls} />
            </Field>

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
            <div className="bg-gray-800/50 border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Review</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Title",      value: form.documentTitle },
                  { label: "Type",       value: form.type },
                  { label: "Category",   value: form.category || "—" },
                  { label: "Date",       value: form.documentDate },
                  { label: "Person",     value: form.personName },
                  { label: "Department", value: form.personDepartment || "—" },
                  { label: "From",       value: form.fromOffice || "—" },
                  { label: "To",         value: form.toOffice || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 px-4 py-2">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest shrink-0 pt-px">{label}</span>
                    <span className="text-sm text-white text-right break-words">{value}</span>
                  </div>
                ))}
              </div>
            </div>

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