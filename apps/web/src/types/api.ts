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

export interface ApiProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  images: ApiProductImage[];
}

export function imageUrl(filename: string): string {
  return `/uploads/${filename}`;
}
