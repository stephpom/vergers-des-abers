import type { ProductCategory } from "@/types/api";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  JUICE: "Boissons › Jus de fruits",
  KEFIR: "Boissons › Kéfir",
  JAM_JELLY: "Confitures et gelées",
};

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "JUICE", label: PRODUCT_CATEGORY_LABELS.JUICE },
  { value: "KEFIR", label: PRODUCT_CATEGORY_LABELS.KEFIR },
  { value: "JAM_JELLY", label: PRODUCT_CATEGORY_LABELS.JAM_JELLY },
] as const;
