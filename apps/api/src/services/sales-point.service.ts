interface SalesPointLocation {
  name: string;
  address: string;
}

const frenchCollator = new Intl.Collator("fr", {
  sensitivity: "base",
  numeric: true,
});

export function salesPointCity(address: string): string {
  const normalizedAddress = address.replace(/\s+/g, " ").trim();
  const cityAfterPostcode = normalizedAddress.match(/\b\d{5}\s+([^,]+)/)?.[1]?.trim();

  if (cityAfterPostcode) return cityAfterPostcode;

  const addressParts = address
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return addressParts.at(-1) ?? "";
}

export function sortSalesPointsByCityAndName<T extends SalesPointLocation>(points: T[]): T[] {
  return points.sort((first, second) => {
    const cityComparison = frenchCollator.compare(
      salesPointCity(first.address),
      salesPointCity(second.address),
    );

    return cityComparison || frenchCollator.compare(first.name, second.name);
  });
}
