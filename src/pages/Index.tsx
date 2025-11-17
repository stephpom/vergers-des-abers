import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Loader2, Apple } from "lucide-react";
import heroImage from "@/assets/hero-juice.jpg";

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
          <div className="flex items-center gap-2">
            <Apple className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">FreshJuice</span>
          </div>
          <CartDrawer />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Fresh Apple Juice"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
        </div>
        
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Pure, Fresh Apple Juice
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
              Made from the finest organic apples. No additives, no preservatives. Just pure, delicious juice.
            </p>
            <a href="#products">
              <button className="px-8 py-4 bg-hero text-hero-foreground hover:bg-hero/90 rounded-lg font-semibold text-lg transition-colors">
                Shop Now
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At FreshJuice, we believe in keeping things simple and natural. Our apple juice is made from handpicked organic apples, 
              cold-pressed to preserve all the natural flavors and nutrients. Every bottle is a taste of pure orchard freshness.
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Products</h2>
          
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
              <Apple className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-6">
                We're still setting up our inventory. Please check back soon!
              </p>
              <p className="text-sm text-muted-foreground">
                Store owner: Tell me what product you'd like to add and I'll create it for you.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Apple className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-primary">FreshJuice</span>
            </div>
            <p className="text-muted-foreground">© 2024 FreshJuice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
