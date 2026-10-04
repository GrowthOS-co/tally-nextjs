import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { formatDate, today } from "@/lib/dates";
import { displayStatus, getInvoice } from "@/lib/invoices";
import { formatCents } from "@/lib/money";
import { StatusBadge } from "@/app/status-badge";
import {
  deleteInvoiceAction,
  markInvoicePaidAction,
  markInvoiceSentAction,
} from "../actions";

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  const { id } = await params;
  const invoice = getInvoice(db, Number(id));
  if (invoice === undefined) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{invoice.number}</h1>
            <StatusBadge status={displayStatus(invoice, today())} />
          </div>
          <p className="text-sm text-gray-500">
            Billed to{" "}
            <Link href={`/customers/${invoice.customer.id}`} className="text-blue-700 hover:underline">
              {invoice.customer.name}
            </Link>
            {invoice.customer.company ? `, ${invoice.customer.company}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <>
              <Link href={`/invoices/${invoice.id}/edit`} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Edit
              </Link>
              <form action={deleteInvoiceAction.bind(null, invoice.id)}>
                <button type="submit" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  Delete
                </button>
              </form>
              <form action={markInvoiceSentAction.bind(null, invoice.id)}>
                <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                  Mark as sent
                </button>
              </form>
            </>
          )}
          {invoice.status === "sent" && (
            <form action={markInvoicePaidAction.bind(null, invoice.id)}>
              <button type="submit" className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
                Mark as paid
              </button>
            </form>
          )}
        </div>
      </div>

      <dl className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-gray-500">Issued</dt>
          <dd className="font-medium">{formatDate(invoice.issueDate)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Due</dt>
          <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Paid</dt>
          <dd className="font-medium">{invoice.paidDate ? formatDate(invoice.paidDate) : "—"}</dd>
        </div>
      </dl>

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Description</th>
            <th className="px-4 py-2 text-right font-medium">Quantity</th>
            <th className="px-4 py-2 text-right font-medium">Unit price</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoice.lineItems.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2">{item.description}</td>
              <td className="px-4 py-2 text-right">{item.quantity}</td>
              <td className="px-4 py-2 text-right">{formatCents(item.unitPriceCents)}</td>
              <td className="px-4 py-2 text-right">{formatCents(item.quantity * item.unitPriceCents)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200">
            <td colSpan={3} className="px-4 py-2 text-right font-medium">
              Total
            </td>
            <td className="px-4 py-2 text-right font-semibold">{formatCents(invoice.total)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-gray-500">Notes</h2>
          <p className="whitespace-pre-line text-sm">{invoice.notes}</p>
        </section>
      )}
    </div>
  );
}
