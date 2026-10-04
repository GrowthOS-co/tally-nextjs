import { notFound } from "next/navigation";
import { db } from "@/db";
import { getCustomer } from "@/lib/customers";
import { updateCustomerAction } from "../../actions";
import { CustomerForm } from "../../customer-form";

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]/edit">) {
  const { id } = await params;
  const customer = getCustomer(db, Number(id));
  if (customer === undefined) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit {customer.name}</h1>
      <CustomerForm
        action={updateCustomerAction.bind(null, customer.id)}
        customer={customer}
        submitLabel="Save changes"
      />
    </div>
  );
}
