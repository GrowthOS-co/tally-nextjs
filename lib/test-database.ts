import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDatabase, type Db } from "@/db";

// A fresh in-memory database with every migration applied.
export function testDatabase(): Db {
  const db = openDatabase(":memory:");
  migrate(db, { migrationsFolder: "drizzle" });
  return db;
}
