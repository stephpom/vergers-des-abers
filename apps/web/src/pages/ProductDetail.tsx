import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";
import { api } from "@/lib/api";
import { imageUrl, type ApiProduct } from "@/types/api";
import { absoluteUrl, stripHtml, truncate } from "@/lib/seo";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api<{ product: ApiProduct }>(`/api/products/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <SEO title="Produit introuvable" noindex />
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <h1 className="text-2xl font-bold">Produit introuvable</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const product = data.product;
  const images = product.images;
  const safeIndex = Math.min(selectedIndex, Math.max(images.length - 1, 0));
  const displayed = images[safeIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={product.title}
        description={
          truncate(stripHtml(product.description), 155) ||
          `${product.title} — produit artisanal Pom'Pom`
        }
        image={product.images[0] ? imageUrl(product.images[0].filename) : undefined}
        type="product"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: truncate(stripHtml(product.description), 300),
            url: absoluteUrl(`/produits/${product.slug}`),
            image: product.images.map((img) => absoluteUrl(imageUrl(img.filename))),
            brand: { "@type": "Brand", name: "Pom'Pom" },
          })}
        </script>
      </SEO>

      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 md:py-20">
        <Link
          to="/#products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à nos produits
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              {displayed ? (
                <img
                  src={imageUrl(displayed.filename)}
                  alt={displayed.alt || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Pas d'image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, index) => {
                  const isActive = index === safeIndex;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      aria-label={`Voir l'image ${index + 1}`}
                      aria-current={isActive}
                      className={`aspect-square overflow-hidden rounded-md bg-muted transition-all ${
                        isActive
                          ? "ring-2 ring-primary"
                          : "opacity-70 hover:opacity-100 hover:ring-1 hover:ring-border"
                      }`}
                    >
                      <img
                        src={imageUrl(img.filename)}
                        alt={img.alt || product.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold">{product.title}</h1>
            <Card>
              <CardContent className="p-6">
                {product.description ? (
                  <div
                    className="prose prose-neutral max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">Description à venir.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ProductDetail;
