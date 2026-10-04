const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

// "12.5" -> 1250. Rejects anything that is not a non-negative amount with at
// most two decimals.
export function dollarsToCents(value: string): number {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Not a valid amount: "${value}"`);
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
