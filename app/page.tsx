import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import { daysBetween, formatDate, today } from "@/lib/dates";
import { dashboardTotals } from "@/lib/invoices";
import { formatCents } from "@/lib/money";

export default async function DashboardPage() {
  await connection();
  const now = today();
  const totals = dashboardTotals(db, now);

  const cards = [
    { label: "Outstanding", value: formatCents(totals.outstandingCents) },
    {
      label: "Overdue",
      value: formatCents(totals.overdueCents),
      detail: `${totals.overdueCount} invoice${totals.overdueCount === 1 ? "" : "s"}`,
    },
    { label: "Paid this month", value: formatCents(totals.paidThisMonthCents) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            {card.detail && <p className="mt-1 text-sm text-gray-500">{card.detail}</p>}
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Overdue invoices</h2>
        {totals.overdueInvoices.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing is overdue.</p>
        ) : (
          <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Invoice</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {totals.overdueInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-2">
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-blue-700 hover:underline">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{invoice.customer.name}</td>
                  <td className="px-4 py-2">
                    {formatDate(invoice.dueDate)}{" "}
                    <span className="text-red-700">
                      ({daysBetween(invoice.dueDate, now)} days late)
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCents(invoice.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
