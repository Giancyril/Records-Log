import { z } from "zod";

const signatureSchema = z
  .string()
  .min(1, "Signature is required")
  .refine(v => v.startsWith("data:image/"), "Must be a valid image data URI");

export const createRecordSchema = z.object({
  type:              z.enum(["INCOMING", "OUTGOING"]),
  documentTitle:     z.string().min(1, "Document title is required").max(200),
  documentNumber:    z.string().max(100).optional().default(""),
  particulars:       z.string().max(1000).optional().default(""),
  category:          z.string().max(100).optional().default(""),
  fromOffice:        z.string().max(200).optional().default(""),
  toOffice:          z.string().max(200).optional().default(""),
  subject:           z.string().max(500).optional().default(""),
  personName:        z.string().min(1, "Person name is required").max(100),
  personEmail:       z.string().email().optional().or(z.literal("")).default(""),
  personDepartment:  z.string().max(100).optional().default(""),
  personPosition:    z.string().max(100).optional().default(""),
  documentDate:      z.string().or(z.date()),
  remarks:           z.string().max(500).optional().default(""),
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

export type CreateRecordInput  = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput  = z.infer<typeof updateRecordSchema>;
export type ReceiveRecordInput = z.infer<typeof receiveRecordSchema>;
export type ReleaseRecordInput = z.infer<typeof releaseRecordSchema>;