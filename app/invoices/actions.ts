"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { today } from "@/lib/dates";
import {
  createInvoice,
  deleteInvoice,
  markInvoicePaid,
  markInvoiceSent,
  updateInvoice,
  type InvoiceInput,
} from "@/lib/invoices";
import { dollarsToCents } from "@/lib/money";

function invoiceFromForm(form: FormData): InvoiceInput {
  const descriptions = form.getAll("description").map(String);
  const quantities = form.getAll("quantity").map(String);
  const unitPrices = form.getAll("unitPrice").map(String);
  const notes = String(form.get("notes")).trim();

  return {
    customerId: Number(form.get("customerId")),
    issueDate: String(form.get("issueDate")),
    dueDate: String(form.get("dueDate")),
    notes: notes === "" ? null : notes,
    lineItems: descriptions.map((description, i) => ({
      description: description.trim(),
      quantity: Number(quantities[i]),
      unitPriceCents: dollarsToCents(unitPrices[i]),
    })),
  };
}

export async function createInvoiceAction(form: FormData) {
  const id = createInvoice(db, invoiceFromForm(form));
  redirect(`/invoices/${id}`);
}

export async function updateInvoiceAction(id: number, form: FormData) {
  updateInvoice(db, id, invoiceFromForm(form));
  redirect(`/invoices/${id}`);
}

export async function markInvoiceSentAction(id: number) {
  markInvoiceSent(db, id);
  redirect(`/invoices/${id}`);
}

export async function markInvoicePaidAction(id: number) {
  markInvoicePaid(db, id, today());
  redirect(`/invoices/${id}`);
}

export async function deleteInvoiceAction(id: number) {
  deleteInvoice(db, id);
  redirect("/invoices");
}
