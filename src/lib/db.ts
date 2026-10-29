import { PrismaClient } from "@prisma/client";

// Im Dev-Modus nur eine Instanz, sonst entstehen bei jedem Hot-Reload neue Verbindungen.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
