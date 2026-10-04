"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { createCustomer, updateCustomer, type CustomerInput } from "@/lib/customers";

function customerFromForm(form: FormData): CustomerInput {
  const company = String(form.get("company")).trim();
  return {
    name: String(form.get("name")).trim(),
    email: String(form.get("email")).trim(),
    company: company === "" ? null : company,
  };
}

export async function createCustomerAction(form: FormData) {
  const id = createCustomer(db, customerFromForm(form));
  redirect(`/customers/${id}`);
}

export async function updateCustomerAction(id: number, form: FormData) {
  updateCustomer(db, id, customerFromForm(form));
  redirect(`/customers/${id}`);
}
