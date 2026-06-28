import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.svg";
import type { ApiProduct } from "@/types/api";

interface ProductsSectionProps {
  products: ApiProduct[];
  isLoading: boolean;
  isError?: boolean;
}

export const ProductsSection = ({ products, isLoading, isError }: ProductsSectionProps) => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
