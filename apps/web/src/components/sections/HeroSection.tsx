import heroImage from "@/assets/hero-verger-sans-personne.webp";

export const HeroSection = () => {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <link rel="preload" as="image" href={heroImage} fetchPriority="high" />
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Vergers Pom'Pom aux Abers - Pommeraies bretonnes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/0" />
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Des boissons vivantes et authentiques
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
            Au cœur des Abers, nos vergers donnent naissance à des jus élaborés avec patience et
            simplicité.
          </p>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground">
            Chaque bouteille est le produit de la sélection de nos fruits, selon leur caractère et
            leur fraîcheur et de notre savoir-faire artisanal.
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
