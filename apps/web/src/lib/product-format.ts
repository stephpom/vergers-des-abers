import type { ProductFormat } from "@/types/api";

export const PRODUCT_FORMAT_LABELS: Record<ProductFormat, string> = {
  CL_33: "33 cl",
  CL_75: "75 cl",
  L_1: "1 L",
};

export const PRODUCT_FORMAT_OPTIONS = [
  { value: "CL_33", label: PRODUCT_FORMAT_LABELS.CL_33 },
  { value: "CL_75", label: PRODUCT_FORMAT_LABELS.CL_75 },
  { value: "L_1", label: PRODUCT_FORMAT_LABELS.L_1 },
] as const;
