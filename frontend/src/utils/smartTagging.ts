import type { Record as Doc } from "../types/types";

const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: "Memorandum", keywords: ["memo", "memorandum", "memoranda"] },
  { category: "Letter", keywords: ["letter", "correspondence", "corresponding"] },
  { category: "Report", keywords: ["report", "analysis", "summary", "audit", "study", "evaluation"] },
  { category: "Request", keywords: ["request", "apply", "application", "permission", "petition"] },
  { category: "Certificate", keywords: ["certificate", "certification", "certify"] },
  { category: "Form", keywords: ["form", "survey", "questionnaire", "application form"] },
  { category: "Notice", keywords: ["notice", "announcement", "bulletin", "advisory"] },
];

const URGENCY_KEYWORDS = [
  "urgent", "asap", "immediate", "priority", "deadline", "critical", "important",
];

export const inferCategorySuggestion = (input: {
  documentTitle?: string;
  subject?: string;
  particulars?: string;
}) => {
  const text = [input.documentTitle, input.subject, input.particulars]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(keyword => text.includes(keyword))) {
      return rule.category;
    }
  }

  return "Other";
};

export const hasUrgencySignal = (input: {
  documentTitle?: string;
  subject?: string;
  particulars?: string;
}) => {
  const text = [input.documentTitle, input.subject, input.particulars]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return URGENCY_KEYWORDS.some(keyword => text.includes(keyword));
};

export type WorkflowPriority = "High" | "Medium" | "Low";

const getRecordAgeDays = (createdAt: string) => {
  const ms = +new Date() - +new Date(createdAt);
  return Math.floor(ms / 86400000);
};

export const determineRecordPriority = (record: Pick<Doc, "status" | "createdAt" | "documentTitle" | "subject" | "particulars">): WorkflowPriority => {
  if (record.status === "PENDING") {
    if (hasUrgencySignal(record)) return "High";
    const age = getRecordAgeDays(record.createdAt);
    if (age >= 7) return "Medium";
    return "Low";
  }
  return "Low";
};

export const getWorkflowInsight = (record: Pick<Doc, "status" | "createdAt" | "documentTitle" | "subject" | "particulars" | "category">) => {
  if (record.status === "PENDING") {
    const age = getRecordAgeDays(record.createdAt);
    if (hasUrgencySignal(record)) return "High urgency record — review and route immediately.";
    if (age >= 7) return "Aging pending record — take action soon to avoid delay.";
    return "Pending record — on track for normal processing.";
  }
  if (record.status === "RECEIVED") return "Received and awaiting release — monitor processing progress.";
  if (record.status === "RELEASED") return "Record completed and released.";
  return "Record status is stable.";
};

export const getAgingPendingRecords = (records: Doc[], thresholdDays = 4) =>
  records.filter(r => r.status === "PENDING" && getRecordAgeDays(r.createdAt) >= thresholdDays);

export const getHighPriorityPendingRecords = (records: Doc[]) =>
  records.filter(r => r.status === "PENDING" && hasUrgencySignal(r));

export const getUncategorizedRecords = (records: Doc[]) =>
  records.filter(r => !r.category || r.category === "Other");
