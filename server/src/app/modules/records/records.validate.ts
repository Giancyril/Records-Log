import { z } from "zod";

const strokePointSchema = z.object({
  x: z.number(),
  y: z.number(),
  time: z.number(),
});

const signatureSchema = z.union([
  z.string()
    .min(1, "Signature is required")
    .refine(
      v => v.startsWith("data:image/") || v.startsWith("["),
      "Must be a valid signature"
    ),
  z.array(z.array(strokePointSchema)).min(1),
]);

export const createRecordSchema = z.object({
  type:               z.enum(["INCOMING", "OUTGOING"]),
  documentTitle:      z.string().min(1, "Document title is required").max(200),
  documentNumber:     z.string().max(100).optional().default(""),
  particulars:        z.string().max(1000).optional().default(""),
  category:           z.string().max(100).optional().default(""),
  fromOffice:         z.string().max(200).optional().default(""),
  toOffice:           z.string().max(200).optional().default(""),
  subject:            z.string().max(500).optional().default(""),
  personName:         z.string().min(1, "Person name is required").max(100),
  personEmail:        z.string().email().optional().or(z.literal("")).default(""),
  personDepartment:   z.string().max(100).optional().default(""),
  personPosition:     z.string().max(100).optional().default(""),
  documentDate:       z.string().or(z.date()),
  remarks:            z.string().max(500).optional().default(""),
  submitterSignature: signatureSchema,
});

export const updateRecordSchema = z.object({
  documentTitle:    z.string().min(1).max(200).optional(),
  documentNumber:   z.string().max(100).optional(),
  particulars:      z.string().max(1000).optional(),
  category:         z.string().max(100).optional(),
  fromOffice:       z.string().max(200).optional(),
  toOffice:         z.string().max(200).optional(),
  subject:          z.string().max(500).optional(),
  personName:       z.string().min(1).max(100).optional(),
  personEmail:      z.string().email().optional(),
  personDepartment: z.string().max(100).optional(),
  personPosition:   z.string().max(100).optional(),
  documentDate:     z.string().or(z.date()).optional(),
  remarks:          z.string().max(500).optional(),
  actionTaken:      z.string().max(500).optional(),
});

export const receiveRecordSchema = z.object({
  actionTaken:       z.string().max(500).optional().default(""),
  remarks:           z.string().max(500).optional().default(""),
  receiverSignature: signatureSchema,
});

export const releaseRecordSchema = z.object({
  actionTaken:       z.string().max(500).optional().default(""),
  remarks:           z.string().max(500).optional().default(""),
  receiverSignature: signatureSchema,
});

// ── Bulk receive / release ────────────────────────────────────────────────────
export const bulkReceiveSchema = z.object({
  ids:               z.array(z.string()).min(1, "At least one record ID required"),
  actionTaken:       z.string().max(500).optional().default(""),
  remarks:           z.string().max(500).optional().default(""),
  receiverSignature: signatureSchema,
});

export const bulkReleaseSchema = z.object({
  ids:               z.array(z.string()).min(1, "At least one record ID required"),
  actionTaken:       z.string().max(500).optional().default(""),
  remarks:           z.string().max(500).optional().default(""),
  receiverSignature: signatureSchema,
});

// ── Comment ───────────────────────────────────────────────────────────────────
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

export type CreateRecordInput  = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput  = z.infer<typeof updateRecordSchema>;
export type ReceiveRecordInput = z.infer<typeof receiveRecordSchema>;
export type ReleaseRecordInput = z.infer<typeof releaseRecordSchema>;
export type BulkReceiveInput   = z.infer<typeof bulkReceiveSchema>;
export type BulkReleaseInput   = z.infer<typeof bulkReleaseSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;