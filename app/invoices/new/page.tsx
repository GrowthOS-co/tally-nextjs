import { connection } from "next/server";
import { db } from "@/db";
import { listCustomers } from "@/lib/customers";
import { addDays, today } from "@/lib/dates";
import { createInvoiceAction } from "../actions";
import { InvoiceForm } from "../invoice-form";

export default async function NewInvoicePage({ searchParams }: PageProps<"/invoices/new">) {
  await connection();
  const { customerId } = await searchParams;
  const issueDate = today();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New invoice</h1>
      <InvoiceForm
        action={createInvoiceAction}
        customers={listCustomers(db)}
        values={{
          customerId: typeof customerId === "string" ? Number(customerId) : null,
          issueDate,
          dueDate: addDays(issueDate, 30),
          notes: null,
          lineItems: [],
        }}
        submitLabel="Create draft"
      />
    </div>
  );
}
