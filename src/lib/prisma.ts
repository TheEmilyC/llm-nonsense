import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { DATABASE_URL } from "@/lib/env-variables";

import { PrismaClient } from "../../generated/client";

const connectionString = `${DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };

export enum PrismaErrorCodes {
  ForeignKeyConstraint = "P2003",
}
