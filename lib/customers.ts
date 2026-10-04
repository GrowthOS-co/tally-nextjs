import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { customers, invoices } from "@/db/schema";

export type CustomerInput = {
  name: string;
  email: string;
  company: string | null;
};

export function listCustomers(db: Db) {
  return db.select().from(customers).orderBy(asc(customers.name)).all();
}

export function getCustomer(db: Db, id: number) {
  return db.query.customers
    .findFirst({
      where: eq(customers.id, id),
      with: {
        invoices: {
          with: { lineItems: true },
          orderBy: desc(invoices.issueDate),
        },
      },
    })
    .sync();
}

export function createCustomer(db: Db, input: CustomerInput): number {
  const row = db
    .insert(customers)
    .values(input)
    .returning({ id: customers.id })
    .get();
  return row.id;
}

export function updateCustomer(db: Db, id: number, input: CustomerInput) {
  db.update(customers).set(input).where(eq(customers.id, id)).run();
}
