import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { CreateTemplateInput, UpdateTemplateInput } from "./templates.validate";

const templateSelect = {
  id: true, name: true, type: true,
  documentTitle: true, documentNumber: true,
  particulars: true, category: true, subject: true,
  fromOffice: true, toOffice: true,
  personName: true, personEmail: true,
  personDepartment: true, personPosition: true,
  remarks: true, createdById: true,
  createdAt: true, updatedAt: true,
};

const getTemplates = async () => {
  return prisma.recordTemplate.findMany({
    orderBy: { createdAt: "desc" },
    select: templateSelect,
  });
};

const createTemplate = async (data: CreateTemplateInput, adminId: string) => {
  return prisma.recordTemplate.create({
    data: { ...data, createdById: adminId },
    select: templateSelect,
  });
};

const updateTemplate = async (id: string, data: UpdateTemplateInput) => {
  const template = await prisma.recordTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError(StatusCodes.NOT_FOUND, "Template not found");
  return prisma.recordTemplate.update({
    where: { id }, data, select: templateSelect,
  });
};

const deleteTemplate = async (id: string) => {
  const template = await prisma.recordTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError(StatusCodes.NOT_FOUND, "Template not found");
  return prisma.recordTemplate.delete({ where: { id } });
};

export const templatesService = { getTemplates, createTemplate, updateTemplate, deleteTemplate };