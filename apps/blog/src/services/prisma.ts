import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

declare let global: { prisma: PrismaClient };

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL ?? "";
  // better-sqlite3 takes a file path, not a file: URL
  return url.startsWith("file:") ? url.slice("file:".length) : url;
};

// eslint-disable-next-line import/no-mutable-exports
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDatabaseUrl() }),
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: getDatabaseUrl() }),
      log: ["query", "info", "warn", "error"],
    });
  }
  prisma = global.prisma;
}

export default prisma;
