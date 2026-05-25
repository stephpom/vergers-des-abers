import vergerAllee from "@/assets/verger-allee.jpg";
import pommesBranche from "@/assets/pommes-branche.jpg";
import recolteSol from "@/assets/recolte-sol.webp";
import seauxPommes from "@/assets/seaux-pommes.jpg";
import producteur from "@/assets/producteur.jpg";
import vergerRangees from "@/assets/verger-rangees.jpg";
import vergerAllee2 from "@/assets/verger-allee2.webp";
import filetsRecolte from "@/assets/filets-recolte.webp";
import sacsRecolte from "@/assets/sacs-recolte.webp";
import camionLivraison from "@/assets/camion-livraison.webp";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  { src: vergerAllee, alt: "Allée des vergers", caption: "Nos pommiers en production" },
  { src: pommesBranche, alt: "Pommes sur branches", caption: "Pommes mûres prêtes à récolter" },
  { src: recolteSol, alt: "Récolte au sol", caption: "La récolte traditionnelle" },
  { src: seauxPommes, alt: "Seaux de pommes", caption: "Récolte des pommes" },
  { src: producteur, alt: "Producteur dans les vergers", caption: "Le producteur passionné" },
  { src: vergerRangees, alt: "Rangées de pommiers", caption: "Les rangées de nos vergers" },
  {
    src: vergerAllee2,
    alt: "Allée ensoleillée entre les pommiers",
    caption: "Au cœur de nos vergers",
  },
  { src: filetsRecolte, alt: "Filets de récolte dans le verger", caption: "Filets de récolte" },
  { src: sacsRecolte, alt: "Grands sacs de pommes récoltées", caption: "Récolte abondante" },
  {
    src: camionLivraison,
    alt: "Livraison de la récolte",
    caption: "Acheminement vers le pressoir",
  },
];

export const GallerySection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Nos Vergers en Images</h2>

        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {GALLERY_ITEMS.map((item, index) => (
              <CarouselItem key={item.alt} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">{item.caption}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};
