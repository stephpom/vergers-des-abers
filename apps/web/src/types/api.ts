export interface ApiUser {
  id: string;
  email: string;
}

export interface ApiProductImage {
  id: string;
  filename: string;
  alt: string;
  position: number;
}

export type ProductCategory = "JUICE" | "KEFIR" | "JAM_JELLY";
export type ProductFormat = "CL_33" | "CL_75" | "L_1";

export interface ApiProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ProductCategory;
  formats: ProductFormat[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  images: ApiProductImage[];
}

export interface ApiSalesPoint {
  id: string;
  name: string;
  address: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PressingRate = "WITH_BOTTLES" | "WITHOUT_BOTTLES";

export interface ApiPressingReservation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  quantityKg: number;
  rate: PressingRate;
  createdAt: string;
}

export interface ApiPressingSlot {
  id: string;
  startsAt: string;
  capacityKg: number;
  reservations: ApiPressingReservation[];
}

export interface ApiAvailablePressingSlot {
  id: string;
  startsAt: string;
  capacityKg: number;
}

export function imageUrl(filename: string): string {
  const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${apiBase}/uploads/${filename}`;
}
