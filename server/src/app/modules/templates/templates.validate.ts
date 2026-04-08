import { z } from "zod";

export const createTemplateSchema = z.object({
  name:             z.string().min(1, "Template name is required").max(100),
  type:             z.enum(["INCOMING", "OUTGOING"]).default("INCOMING"),
  documentTitle:    z.string().max(200).optional().default(""),
  documentNumber:   z.string().max(100).optional().default(""),
  particulars:      z.string().max(1000).optional().default(""),
  category:         z.string().max(100).optional().default(""),
  subject:          z.string().max(500).optional().default(""),
  fromOffice:       z.string().max(200).optional().default(""),
  toOffice:         z.string().max(200).optional().default(""),
  personName:       z.string().max(100).optional().default(""),
  personEmail:      z.string().email().optional().or(z.literal("")).default(""),
  personDepartment: z.string().max(100).optional().default(""),
  personPosition:   z.string().max(100).optional().default(""),
  remarks:          z.string().max(500).optional().default(""),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;