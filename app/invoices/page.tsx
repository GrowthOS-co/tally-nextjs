import Link from "next/link";
import { db } from "@/db";
import { formatDate, today } from "@/lib/dates";
import { displayStatus, listInvoices, type DisplayStatus } from "@/lib/invoices";
import { formatCents } from "@/lib/money";
import { StatusBadge } from "@/app/status-badge";

const filters: { label: string; status: DisplayStatus | null }[] = [
  { label: "All", status: null },
  { label: "Draft", status: "draft" },
  { label: "Sent", status: "sent" },
  { label: "Overdue", status: "overdue" },
  { label: "Paid", status: "paid" },
];

function parseStatus(value: string | string[] | undefined): DisplayStatus | null {
  return filters.find((filter) => filter.status === value)?.status ?? null;
}

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  const status = parseStatus((await searchParams).status);
  const now = today();
  const invoices = listInvoices(db, { status, today: now });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/invoices/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          New invoice
        </Link>
      </div>

      <nav className="flex gap-2 text-sm">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.status ? `/invoices?status=${filter.status}` : "/invoices"}
            className={`rounded-full px-3 py-1 ${
              filter.status === status ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Invoice</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Issued</th>
              <th className="px-4 py-2 font-medium">Due</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-2">
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-blue-700 hover:underline">
                    {invoice.number}
                  </Link>
                </td>
                <td className="px-4 py-2">{invoice.customer.name}</td>
                <td className="px-4 py-2">{formatDate(invoice.issueDate)}</td>
                <td className="px-4 py-2">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={displayStatus(invoice, now)} />
                </td>
                <td className="px-4 py-2 text-right">{formatCents(invoice.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
