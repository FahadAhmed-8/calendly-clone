import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const DEFAULT_HOST_USERNAME = "fhd";

export async function getDefaultHost() {
  const host = await prisma.user.findUnique({ where: { username: DEFAULT_HOST_USERNAME } });
  if (!host) throw new Error("Default host not seeded. Run `npm run db:seed`.");
  return host;
}
