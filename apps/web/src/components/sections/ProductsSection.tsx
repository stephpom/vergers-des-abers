import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import logo from "@/assets/logo.svg";
import type { ApiProduct } from "@/types/api";
import { useState } from "react";
import { PRODUCT_FORMAT_OPTIONS } from "@/lib/product-format";
import type { ProductFormat } from "@/types/api";

interface ProductsSectionProps {
  products: ApiProduct[];
  isLoading: boolean;
  isError?: boolean;
}

const productRows = [
  { value: "JUICE", title: "Boissons" },
  { value: "KEFIR", title: "Kéfirs" },
  { value: "JAM_JELLY", title: "Confitures et gelées" },
] as const;

export const ProductsSection = ({ products, isLoading, isError }: ProductsSectionProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ProductFormat | null>(null);
  const filteredProducts = selectedFormat
    ? products.filter((product) => product.formats?.includes(selectedFormat))
    : products;

  return (
    <section id="products" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Nos Produits</h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Découvrez notre gamme artisanale 100% pommes bretonnes
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-xl border border-border/50 overflow-hidden"
              >
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold mb-2 text-destructive">
              Impossible de charger les produits
            </h3>
            <p className="text-muted-foreground mb-6">
              Une erreur réseau est survenue. Vérifiez votre connexion et réessayez.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Réessayer
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-12">
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              aria-label="Filtrer les produits par format"
            >
              <span className="mr-2 text-sm font-medium text-muted-foreground">Format :</span>
              <ButtonFilter
                active={selectedFormat === null}
                onClick={() => setSelectedFormat(null)}
                label="Tous"
              />
              {PRODUCT_FORMAT_OPTIONS.map((format) => (
                <ButtonFilter
                  key={format.value}
                  active={selectedFormat === format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  label={format.label}
                />
              ))}
            </div>
            {productRows.map((row) => {
              const rowProducts = filteredProducts.filter(
                (product) => (product.category ?? "JUICE") === row.value,
              );

              if (rowProducts.length === 0) return null;

              const headingId = `products-${row.value.toLowerCase()}`;

              return (
                <section key={row.value} aria-labelledby={headingId}>
                  <h3 id={headingId} className="mb-6 text-2xl font-bold">
                    {row.title}
                  </h3>
                  <Carousel opts={{ align: "start" }} aria-labelledby={headingId}>
                    <CarouselContent className="items-stretch">
                      {rowProducts.map((product) => (
                        <CarouselItem
                          key={product.id}
                          className="basis-[88%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                        >
                          <ProductCard product={product} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-top-12 left-auto right-12 translate-y-0" />
                    <CarouselNext className="-top-12 right-0 translate-y-0" />
                  </Carousel>
                </section>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="py-10 text-center text-muted-foreground">
                Aucun produit n'est disponible dans ce format.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <img src={logo} alt="Pom'Pom" className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">Pas encore de produits</h3>
            <p className="text-muted-foreground mb-6">
              Nous préparons notre inventaire. Revenez bientôt !
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

interface ButtonFilterProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const ButtonFilter = ({ active, label, onClick }: ButtonFilterProps) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background hover:bg-muted"
    }`}
  >
    {label}
  </button>
);
