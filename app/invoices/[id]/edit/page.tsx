import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { listCustomers } from "@/lib/customers";
import { getInvoice } from "@/lib/invoices";
import { updateInvoiceAction } from "../../actions";
import { InvoiceForm } from "../../invoice-form";

export default async function EditInvoicePage({ params }: PageProps<"/invoices/[id]/edit">) {
  const { id } = await params;
  const invoice = getInvoice(db, Number(id));
  if (invoice === undefined) notFound();

  if (invoice.status !== "draft") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Edit {invoice.number}</h1>
        <p className="text-sm text-gray-600">
          Only draft invoices can be edited. This one is {invoice.status}.
        </p>
        <Link href={`/invoices/${invoice.id}`} className="text-sm text-blue-700 hover:underline">
          Back to the invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit {invoice.number}</h1>
      <InvoiceForm
        action={updateInvoiceAction.bind(null, invoice.id)}
        customers={listCustomers(db)}
        values={invoice}
        submitLabel="Save changes"
      />
    </div>
  );
}
