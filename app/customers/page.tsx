import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import { listCustomers } from "@/lib/customers";

export default async function CustomersPage() {
  await connection();
  const customers = listCustomers(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link href="/customers/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          New customer
        </Link>
      </div>
      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Company</th>
            <th className="px-4 py-2 font-medium">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-2">
                <Link href={`/customers/${customer.id}`} className="font-medium text-blue-700 hover:underline">
                  {customer.name}
                </Link>
              </td>
              <td className="px-4 py-2">{customer.company ?? "—"}</td>
              <td className="px-4 py-2">{customer.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
