// Replaces everything in the database with the sample business below. Dates
// are relative to today, so the dashboard always has overdue invoices and
// payments this month.
import { sql } from "drizzle-orm";
import { addDays, startOfMonth, today } from "../lib/dates";
import { db } from "./index";
import { customers, invoices, lineItems, type InvoiceStatus } from "./schema";

const sampleCustomers = [
  { name: "Maya Ortiz", email: "maya@harborandpine.example", company: "Harbor & Pine Interiors" },
  { name: "Daniel Kim", email: "daniel@kimphoto.example", company: "Kim Photography" },
  { name: "Priya Raman", email: "priya.raman@example.com", company: null },
  { name: "Lucas Weber", email: "lucas@northfieldbikes.example", company: "Northfield Bikes" },
  { name: "Aisha Bello", email: "aisha@bellocatering.example", company: "Bello Catering" },
  { name: "Tom Gallagher", email: "tom.gallagher@example.com", company: null },
  { name: "Sofia Marques", email: "sofia@lumenstudio.example", company: "Lumen Studio" },
  { name: "Ethan Brooks", email: "ethan@brooksandco.example", company: "Brooks & Co. Accounting" },
];

type SampleInvoice = {
  customer: number; // index into sampleCustomers
  issuedDaysAgo: number;
  termDays: number;
  status: InvoiceStatus;
  paidDaysAgo?: number;
  notes?: string;
  items: [description: string, quantity: number, unitPriceCents: number][];
};

const sampleInvoices: SampleInvoice[] = [
  { customer: 0, issuedDaysAgo: 95, termDays: 30, status: "paid", paidDaysAgo: 70, items: [["Interior design consultation (hours)", 4, 15000], ["Mood boards", 2, 7500]] },
  { customer: 1, issuedDaysAgo: 80, termDays: 30, status: "paid", paidDaysAgo: 52, items: [["Product photography, half day", 1, 60000], ["Image retouching", 25, 1200]] },
  { customer: 3, issuedDaysAgo: 60, termDays: 30, status: "paid", paidDaysAgo: 33, items: [["Website maintenance, monthly", 1, 25000]] },
  { customer: 4, issuedDaysAgo: 40, termDays: 30, status: "paid", paidDaysAgo: 2, items: [["Event menu planning", 1, 40000], ["Tasting session", 2, 9500]] },
  { customer: 6, issuedDaysAgo: 35, termDays: 30, status: "paid", paidDaysAgo: 1, items: [["Brand identity package", 1, 180000]] },
  { customer: 7, issuedDaysAgo: 30, termDays: 30, status: "paid", paidDaysAgo: 0, notes: "Thank you for your prompt payment.", items: [["Bookkeeping, monthly", 1, 45000]] },
  { customer: 0, issuedDaysAgo: 50, termDays: 30, status: "sent", notes: "Net 30.", items: [["Furniture sourcing (hours)", 6, 8000]] },
  { customer: 2, issuedDaysAgo: 45, termDays: 30, status: "sent", items: [["Copywriting, per page", 5, 12000]] },
  { customer: 5, issuedDaysAgo: 38, termDays: 30, status: "sent", items: [["Garden design consultation (hours)", 3, 9000], ["Site visit", 1, 6000]] },
  { customer: 3, issuedDaysAgo: 33, termDays: 30, status: "sent", items: [["Website maintenance, monthly", 1, 25000], ["Hosting renewal", 1, 12000]] },
  { customer: 1, issuedDaysAgo: 20, termDays: 30, status: "sent", items: [["Headshot session", 8, 9500]] },
  { customer: 4, issuedDaysAgo: 15, termDays: 30, status: "sent", notes: "Net 30.", items: [["Corporate lunch catering, per guest", 40, 2200]] },
  { customer: 6, issuedDaysAgo: 12, termDays: 30, status: "sent", items: [["Social media templates", 10, 4500]] },
  { customer: 7, issuedDaysAgo: 10, termDays: 30, status: "sent", items: [["Quarterly tax filing", 1, 75000]] },
  { customer: 5, issuedDaysAgo: 7, termDays: 30, status: "sent", items: [["Planting plan", 1, 30000]] },
  { customer: 0, issuedDaysAgo: 5, termDays: 30, status: "sent", items: [["Lighting plan", 1, 52000]] },
  { customer: 2, issuedDaysAgo: 3, termDays: 30, status: "draft", items: [["Blog posts", 4, 15000]] },
  { customer: 3, issuedDaysAgo: 2, termDays: 30, status: "draft", items: [["Bike fleet servicing, per bike", 12, 6500]] },
  { customer: 4, issuedDaysAgo: 1, termDays: 30, status: "draft", notes: "50% deposit.", items: [["Wedding catering deposit", 1, 150000]] },
  { customer: 6, issuedDaysAgo: 0, termDays: 30, status: "draft", items: [["Packaging design", 1, 95000], ["Print-ready files", 3, 5000]] },
];

const now = today();

// A payment made "this month" stays in this month even on the 1st.
function paidDate(daysAgo: number): string {
  const date = addDays(now, -daysAgo);
  return daysAgo <= 2 && date < startOfMonth(now) ? startOfMonth(now) : date;
}

db.transaction((tx) => {
  tx.delete(lineItems).run();
  tx.delete(invoices).run();
  tx.delete(customers).run();
  tx.run(sql`DELETE FROM sqlite_sequence`);

  const customerIds = sampleCustomers.map(
    (customer) =>
      tx.insert(customers).values(customer).returning({ id: customers.id }).get().id,
  );

  sampleInvoices.forEach((sample, index) => {
    const issueDate = addDays(now, -sample.issuedDaysAgo);
    const { id } = tx
      .insert(invoices)
      .values({
        number: `INV-${String(index + 1).padStart(4, "0")}`,
        customerId: customerIds[sample.customer],
        issueDate,
        dueDate: addDays(issueDate, sample.termDays),
        status: sample.status,
        paidDate: sample.paidDaysAgo === undefined ? null : paidDate(sample.paidDaysAgo),
        notes: sample.notes ?? null,
      })
      .returning({ id: invoices.id })
      .get();
    tx.insert(lineItems)
      .values(
        sample.items.map(([description, quantity, unitPriceCents]) => ({
          invoiceId: id,
          description,
          quantity,
          unitPriceCents,
        })),
      )
      .run();
  });
});

console.log(
  `Seeded ${sampleCustomers.length} customers and ${sampleInvoices.length} invoices.`,
);
