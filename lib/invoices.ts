import { desc, eq, max } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import {
  invoices,
  lineItems,
  type Invoice,
  type InvoiceStatus,
  type LineItem,
} from "@/db/schema";
import { startOfMonth } from "./dates";

export type LineItemInput = Pick<
  LineItem,
  "description" | "quantity" | "unitPriceCents"
>;

export type InvoiceInput = {
  customerId: number;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  lineItems: LineItemInput[];
};

// What a list shows: overdue is not stored, it is a sent invoice past its due
// date.
export type DisplayStatus = InvoiceStatus | "overdue";

export class InvoiceStateError extends Error {
  constructor(invoice: Pick<Invoice, "number" | "status">, action: string) {
    super(`Invoice ${invoice.number} is ${invoice.status} and cannot be ${action}.`);
    this.name = "InvoiceStateError";
  }
}

export function invoiceTotal(
  items: Pick<LineItem, "quantity" | "unitPriceCents">[],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
}

export function isOverdue(
  invoice: Pick<Invoice, "status" | "dueDate">,
  today: string,
): boolean {
  return invoice.status === "sent" && invoice.dueDate < today;
}

export function displayStatus(
  invoice: Pick<Invoice, "status" | "dueDate">,
  today: string,
): DisplayStatus {
  return isOverdue(invoice, today) ? "overdue" : invoice.status;
}

function allInvoices(db: Db) {
  return db.query.invoices
    .findMany({
      with: { customer: true, lineItems: true },
      orderBy: desc(invoices.issueDate),
    })
    .sync()
    .map((invoice) => ({ ...invoice, total: invoiceTotal(invoice.lineItems) }));
}

export function listInvoices(
  db: Db,
  filter: { status: DisplayStatus | null; today: string },
) {
  const rows = allInvoices(db);
  if (filter.status === null) return rows;
  return rows.filter(
    (invoice) => displayStatus(invoice, filter.today) === filter.status,
  );
}

export function getInvoice(db: Db, id: number) {
  const invoice = db.query.invoices
    .findFirst({
      where: eq(invoices.id, id),
      with: { customer: true, lineItems: true },
    })
    .sync();
  if (invoice === undefined) return undefined;
  return { ...invoice, total: invoiceTotal(invoice.lineItems) };
}

export function dashboardTotals(db: Db, today: string) {
  const rows = allInvoices(db);
  const monthStart = startOfMonth(today);
  const overdue = rows
    .filter((invoice) => isOverdue(invoice, today))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    outstandingCents: rows
      .filter((invoice) => invoice.status === "sent")
      .reduce((sum, invoice) => sum + invoice.total, 0),
    overdueCount: overdue.length,
    overdueCents: overdue.reduce((sum, invoice) => sum + invoice.total, 0),
    paidThisMonthCents: rows
      .filter(
        (invoice) =>
          invoice.status === "paid" &&
          invoice.paidDate !== null &&
          invoice.paidDate >= monthStart &&
          invoice.paidDate <= today,
      )
      .reduce((sum, invoice) => sum + invoice.total, 0),
    overdueInvoices: overdue,
  };
}

function nextInvoiceNumber(db: Db | Tx): string {
  const row = db.select({ last: max(invoices.id) }).from(invoices).get();
  const next = (row?.last ?? 0) + 1;
  return `INV-${String(next).padStart(4, "0")}`;
}

function findInvoice(db: Db | Tx, id: number) {
  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (invoice === undefined) throw new Error(`Invoice ${id} does not exist.`);
  return invoice;
}

export function createInvoice(db: Db, input: InvoiceInput): number {
  return db.transaction((tx) => {
    const { id } = tx
      .insert(invoices)
      .values({
        number: nextInvoiceNumber(tx),
        customerId: input.customerId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        notes: input.notes,
      })
      .returning({ id: invoices.id })
      .get();
    if (input.lineItems.length > 0) {
      tx.insert(lineItems)
        .values(input.lineItems.map((item) => ({ ...item, invoiceId: id })))
        .run();
    }
    return id;
  });
}

// Only a draft can change: once sent, the customer has a copy.
export function updateInvoice(db: Db, id: number, input: InvoiceInput) {
  db.transaction((tx) => {
    const invoice = findInvoice(tx, id);
    if (invoice.status !== "draft") {
      throw new InvoiceStateError(invoice, "edited");
    }
    tx.update(invoices)
      .set({
        customerId: input.customerId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        notes: input.notes,
      })
      .where(eq(invoices.id, id))
      .run();
    tx.delete(lineItems).where(eq(lineItems.invoiceId, id)).run();
    if (input.lineItems.length > 0) {
      tx.insert(lineItems)
        .values(input.lineItems.map((item) => ({ ...item, invoiceId: id })))
        .run();
    }
  });
}

export function markInvoiceSent(db: Db, id: number) {
  const invoice = findInvoice(db, id);
  if (invoice.status !== "draft") {
    throw new InvoiceStateError(invoice, "sent");
  }
  db.update(invoices).set({ status: "sent" }).where(eq(invoices.id, id)).run();
}

export function markInvoicePaid(db: Db, id: number, today: string) {
  const invoice = findInvoice(db, id);
  if (invoice.status !== "sent") {
    throw new InvoiceStateError(invoice, "marked as paid");
  }
  db.update(invoices)
    .set({ status: "paid", paidDate: today })
    .where(eq(invoices.id, id))
    .run();
}

export function deleteInvoice(db: Db, id: number) {
  const invoice = findInvoice(db, id);
  if (invoice.status !== "draft") {
    throw new InvoiceStateError(invoice, "deleted");
  }
  db.delete(invoices).where(eq(invoices.id, id)).run();
}
