import prisma from "../app/config/prisma";
import { utils } from "../app/utils/utils";
import dotenv from "dotenv";
dotenv.config();

export const ADMIN_UUID = "00000000-0000-0000-0000-000000000000";

async function seed() {
  console.log("🌱 Seeding database...");

  // Remove existing admin if it has a different ID to prevent unique constraint errors
  try {
    const existing = await prisma.user.findUnique({ where: { username: "admin" } });
    if (existing && existing.id !== ADMIN_UUID) {
      await prisma.user.delete({ where: { id: existing.id } });
      console.log("♻️  Removed old admin user to replace with static UUID.");
    }
  } catch (e) {
    // Ignore if not present
  }

  const hashed = await utils.hashPassword("Admin@1234");
  const admin  = await prisma.user.upsert({
    where: { id: ADMIN_UUID },
    update: {},
    create: {
      id: ADMIN_UUID,
      username: "admin",
      email:    "admin@nbsc.edu.ph",
      password: hashed,
      name:     "System Admin",
      role:     "ADMIN",
    },
  });

  console.log(`✅ System Admin seeded: ${admin.email}`);
  await prisma.$disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });