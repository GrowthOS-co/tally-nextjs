import { createCustomerAction } from "../actions";
import { CustomerForm } from "../customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New customer</h1>
      <CustomerForm action={createCustomerAction} submitLabel="Create customer" />
    </div>
  );
}
