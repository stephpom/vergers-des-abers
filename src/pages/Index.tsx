import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Loader2 } from "lucide-react";
import heroImage from "@/assets/verger-pommiers.jpg";
import logo from "@/assets/logo.svg";
import vergerAllee from "@/assets/verger-allee.jpg";
import vergerAllee2 from "@/assets/verger-allee2.jpg";
import recolteSol from "@/assets/recolte-sol.jpg";
import seauxPommes from "@/assets/seaux-pommes.jpg";
import producteur from "@/assets/producteur.jpg";
import pommesBranche from "@/assets/pommes-branche.jpg";
import vergerRangees from "@/assets/verger-rangees.jpg";
import filetsRecolte from "@/assets/filets-recolte.jpg";
import sacsRecolte from "@/assets/sacs-recolte.jpg";
import camionLivraison from "@/assets/camion-livraison.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(20),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Pom'Pom Logo" className="h-12 w-auto" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold text-primary leading-tight">Pom'Pom</span>
              <span className="text-xs md:text-sm text-muted-foreground">Vergers des Abers</span>
            </div>
          </div>
          <CartDrawer />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
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
              Fabrication artisanale de jus de pomme 100% naturel. Sans additifs, sans conservateurs. Le goût authentique de nos vergers bretons.
            </p>
            <a href="#products">
              <button className="px-8 py-4 bg-hero text-hero-foreground hover:bg-hero/90 rounded-lg font-semibold text-lg transition-colors">
                Acheter Maintenant
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Nos Vergers des Abers</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Pom'Pom, c'est avant tout une histoire de passion pour la pomme et le terroir breton. Nos vergers situés aux Abers produisent des pommes de qualité, 
              pressées à froid pour préserver toutes les saveurs et vitamines naturelles. Chaque bouteille capture l'authenticité de notre région et le savoir-faire artisanal transmis de génération en génération.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Nos Vergers en Images</h2>
          
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={vergerAllee} 
                      alt="Allée des vergers" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Nos pommiers en production</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={pommesBranche} 
                      alt="Pommes sur branches" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Pommes mûres prêtes à récolter</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={recolteSol} 
                      alt="Récolte au sol" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">La récolte traditionnelle</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={seauxPommes} 
                      alt="Seaux de pommes" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Récolte des pommes</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={producteur} 
                      alt="Producteur dans les vergers" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Le producteur passionné</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={vergerRangees} 
                      alt="Rangées de pommiers" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Les rangées de nos vergers</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={vergerAllee2} 
                      alt="Allée ensoleillée entre les pommiers" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Au cœur de nos vergers</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={filetsRecolte} 
                      alt="Filets de récolte dans le verger" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Filets de récolte</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={sacsRecolte} 
                      alt="Grands sacs de pommes récoltées" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Récolte abondante</p>
                </div>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={camionLivraison} 
                      alt="Livraison de la récolte" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 text-muted-foreground">Acheminement vers le pressoir</p>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Nos Produits</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.node.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <img src={logo} alt="Pom'Pom" className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-semibold mb-2">Pas encore de produits</h3>
              <p className="text-muted-foreground mb-6">
                Nous préparons notre inventaire. Revenez bientôt !
              </p>
              <p className="text-sm text-muted-foreground">
                Propriétaire : Dites-moi quel produit vous souhaitez ajouter et je le créerai pour vous.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="Pom'Pom Logo" className="h-10 w-auto" />
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold text-primary">Pom'Pom</span>
                <span className="text-xs text-muted-foreground">Vergers des Abers</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              Jus de pomme artisanal 100% naturel
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Pom'Pom - Vergers des Abers. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
