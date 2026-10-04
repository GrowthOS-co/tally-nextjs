import type { Customer } from "@/db/schema";

const input = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

export function CustomerForm({
  action,
  customer,
  submitLabel,
}: {
  action: (form: FormData) => Promise<void>;
  customer?: Customer;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <label className="block text-sm font-medium">
        Name
        <input name="name" required defaultValue={customer?.name} className={input} />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required defaultValue={customer?.email} className={input} />
      </label>
      <label className="block text-sm font-medium">
        Company <span className="font-normal text-gray-500">(optional)</span>
        <input name="company" defaultValue={customer?.company ?? ""} className={input} />
      </label>
      <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
        {submitLabel}
      </button>
    </form>
  );
}
