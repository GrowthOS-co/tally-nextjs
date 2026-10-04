"use client";

import { useState } from "react";
import type { Customer } from "@/db/schema";
import type { InvoiceInput } from "@/lib/invoices";
import { centsToDollars } from "@/lib/money";

const input = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

// A new invoice may not have a customer chosen yet.
export type InvoiceFormValues = Omit<InvoiceInput, "customerId"> & {
  customerId: number | null;
};

type Row = { key: number; description: string; quantity: string; unitPrice: string };

let nextKey = 0;
function row(description = "", quantity = "1", unitPrice = ""): Row {
  return { key: nextKey++, description, quantity, unitPrice };
}

export function InvoiceForm({
  action,
  customers,
  values,
  submitLabel,
}: {
  action: (form: FormData) => Promise<void>;
  customers: Customer[];
  values: InvoiceFormValues;
  submitLabel: string;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    values.lineItems.length === 0
      ? [row()]
      : values.lineItems.map((item) =>
          row(item.description, String(item.quantity), centsToDollars(item.unitPriceCents)),
        ),
  );

  return (
    <form action={action} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          Customer
          <select name="customerId" required defaultValue={values.customerId ?? ""} className={input}>
            <option value="" disabled>
              Choose a customer
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.company ? ` (${customer.company})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Issue date
          <input name="issueDate" type="date" required defaultValue={values.issueDate} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Due date
          <input name="dueDate" type="date" required defaultValue={values.dueDate} className={input} />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Line items</legend>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[1fr_6rem_8rem_auto] items-end gap-2">
            <input name="description" required placeholder="Description" defaultValue={r.description} className={input} />
            <input name="quantity" type="number" min="1" step="1" required defaultValue={r.quantity} aria-label="Quantity" className={input} />
            <input name="unitPrice" inputMode="decimal" pattern="\d+(\.\d{1,2})?" required placeholder="0.00" defaultValue={r.unitPrice} aria-label="Unit price" className={input} />
            <button
              type="button"
              onClick={() => setRows(rows.filter((other) => other.key !== r.key))}
              disabled={rows.length === 1}
              className="mb-1 rounded-md px-2 py-1 text-sm text-gray-500 hover:text-red-700 disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows([...rows, row()])}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          + Add line item
        </button>
      </fieldset>

      <label className="block text-sm font-medium">
        Notes <span className="font-normal text-gray-500">(optional)</span>
        <textarea name="notes" rows={3} defaultValue={values.notes ?? ""} className={input} />
      </label>

      <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
        {submitLabel}
      </button>
    </form>
  );
}
