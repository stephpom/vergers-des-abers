import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiProduct } from "@/types/api";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { SavoirFaireSection } from "@/components/sections/SavoirFaireSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { SEO } from "@/components/SEO";
import { getSiteUrl, absoluteUrl } from "@/lib/seo";

const Index = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api<{ products: ApiProduct[] }>("/api/products"),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO type="website">
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Pom'Pom — Vergers des Abers",
            url: getSiteUrl(),
            logo: absoluteUrl("/logo.svg"),
            address: {
              "@type": "PostalAddress",
              streetAddress: "592 Lanvaon",
              addressLocality: "Plouguerneau",
              postalCode: "29880",
              addressCountry: "FR",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+33644086073",
              email: "pom-pom@mailo.com",
              contactType: "customer service",
            },
          })}
        </script>
      </SEO>
      <PublicHeader />
      <HeroSection />
      <AboutSection />
      <SavoirFaireSection />
      <GallerySection />
      <ProductsSection products={data?.products ?? []} isLoading={isLoading} />
      <PublicFooter />
    </div>
  );
};

export default Index;
