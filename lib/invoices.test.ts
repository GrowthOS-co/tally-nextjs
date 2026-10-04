import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createCustomer } from "./customers";
import {
  createInvoice,
  dashboardTotals,
  getInvoice,
  invoiceTotal,
  isOverdue,
  markInvoicePaid,
  markInvoiceSent,
  updateInvoice,
  InvoiceStateError,
  type InvoiceInput,
} from "./invoices";
import { testDatabase } from "./test-database";

const today = "2026-03-15";

let db: Db;
let customerId: number;

beforeEach(() => {
  db = testDatabase();
  customerId = createCustomer(db, {
    name: "Maya Ortiz",
    email: "maya@example.com",
    company: null,
  });
});

function invoice(overrides: Partial<InvoiceInput> = {}): InvoiceInput {
  return {
    customerId,
    issueDate: "2026-02-01",
    dueDate: "2026-03-03",
    notes: null,
    lineItems: [{ description: "Consulting", quantity: 1, unitPriceCents: 10000 }],
    ...overrides,
  };
}

describe("invoiceTotal", () => {
  it("adds up quantity times unit price over every line item", () => {
    expect(
      invoiceTotal([
        { quantity: 3, unitPriceCents: 1250 },
        { quantity: 1, unitPriceCents: 9999 },
      ]),
    ).toBe(13749);
  });
});

describe("isOverdue", () => {
  it("is overdue only when sent and the due date has passed", () => {
    expect(isOverdue({ status: "sent", dueDate: "2026-03-14" }, today)).toBe(true);
    expect(isOverdue({ status: "sent", dueDate: "2026-03-15" }, today)).toBe(false);
    expect(isOverdue({ status: "paid", dueDate: "2026-03-01" }, today)).toBe(false);
    expect(isOverdue({ status: "draft", dueDate: "2026-03-01" }, today)).toBe(false);
  });
});

describe("dashboardTotals", () => {
  it("totals outstanding, overdue and paid this month", () => {
    const sentOverdue = createInvoice(db, invoice({ dueDate: "2026-03-10" }));
    markInvoiceSent(db, sentOverdue);

    const sentNotDue = createInvoice(
      db,
      invoice({
        dueDate: "2026-04-01",
        lineItems: [{ description: "Design", quantity: 2, unitPriceCents: 5000 }],
      }),
    );
    markInvoiceSent(db, sentNotDue);

    const paidThisMonth = createInvoice(
      db,
      invoice({ lineItems: [{ description: "Audit", quantity: 1, unitPriceCents: 30000 }] }),
    );
    markInvoiceSent(db, paidThisMonth);
    markInvoicePaid(db, paidThisMonth, "2026-03-02");

    const paidLastMonth = createInvoice(
      db,
      invoice({ lineItems: [{ description: "Setup", quantity: 1, unitPriceCents: 70000 }] }),
    );
    markInvoiceSent(db, paidLastMonth);
    markInvoicePaid(db, paidLastMonth, "2026-02-27");

    createInvoice(
      db,
      invoice({ lineItems: [{ description: "Draft work", quantity: 1, unitPriceCents: 99900 }] }),
    );

    const totals = dashboardTotals(db, today);
    expect(totals.outstandingCents).toBe(20000);
    expect(totals.overdueCount).toBe(1);
    expect(totals.overdueCents).toBe(10000);
    expect(totals.paidThisMonthCents).toBe(30000);
    expect(totals.overdueInvoices.map((i) => i.id)).toEqual([sentOverdue]);
  });
});

describe("updateInvoice", () => {
  it("refuses to change an invoice that has been sent", () => {
    const id = createInvoice(db, invoice());
    markInvoiceSent(db, id);

    expect(() =>
      updateInvoice(
        db,
        id,
        invoice({ lineItems: [{ description: "Changed", quantity: 5, unitPriceCents: 1 }] }),
      ),
    ).toThrow(InvoiceStateError);
    expect(getInvoice(db, id)?.lineItems.map((item) => item.description)).toEqual([
      "Consulting",
    ]);
  });
});
