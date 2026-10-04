import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { formatDate, today } from "@/lib/dates";
import { getCustomer } from "@/lib/customers";
import { displayStatus, invoiceTotal } from "@/lib/invoices";
import { formatCents } from "@/lib/money";
import { StatusBadge } from "@/app/status-badge";

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const customer = getCustomer(db, Number(id));
  if (customer === undefined) notFound();
  const now = today();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-gray-500">
            {customer.company ? `${customer.company} · ` : ""}
            {customer.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/customers/${customer.id}/edit`} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Edit
          </Link>
          <Link href={`/invoices/new?customerId=${customer.id}`} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
            New invoice
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Invoices</h2>
        {customer.invoices.length === 0 ? (
          <p className="text-sm text-gray-500">No invoices yet.</p>
        ) : (
          <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Invoice</th>
                <th className="px-4 py-2 font-medium">Issued</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customer.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-2">
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-blue-700 hover:underline">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-2">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={displayStatus(invoice, now)} />
                  </td>
                  <td className="px-4 py-2 text-right">{formatCents(invoiceTotal(invoice.lineItems))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
