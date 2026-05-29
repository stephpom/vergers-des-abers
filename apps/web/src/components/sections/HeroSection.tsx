import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/verger-pommiers.webp";

export const HeroSection = () => {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <Helmet>
        <link rel="preload" as="image" href={heroImage} fetchPriority="high" />
      </Helmet>
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Vergers Pom'Pom aux Abers - Pommeraies bretonnes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Pur Jus de Pomme des Abers
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
            Fabrication artisanale de jus de pomme 100% naturel. Sans additifs, sans conservateurs.
            Le goût authentique de nos vergers bretons.
          </p>
          <a
            href="#products"
            className="inline-block px-8 py-4 bg-hero text-hero-foreground hover:bg-hero/90 rounded-lg font-semibold text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Voir nos produits
          </a>
        </div>
      </div>
    </section>
  );
};
