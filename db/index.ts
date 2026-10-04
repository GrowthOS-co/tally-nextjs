import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

// A transaction can run every query the database can.
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export const DATABASE_FILE = "tally.db";

export function openDatabase(file: string): Db {
  const sqlite = new Database(file);
  sqlite.pragma("foreign_keys = ON");
  return drizzle({ client: sqlite, schema });
}

export const db = openDatabase(DATABASE_FILE);
