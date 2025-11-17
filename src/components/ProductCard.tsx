import { ShopifyProduct } from "@/lib/shopify";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const { node } = product;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const variant = node.variants.edges[0]?.node;
    if (!variant) return;

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success("Ajouté au panier", {
      description: node.title,
    });
  };

  const imageUrl = node.images.edges[0]?.node.url;
  const price = node.priceRange.minVariantPrice;

  return (
    <Link to={`/product/${node.handle}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={node.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Pas d'image
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{node.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{node.description}</p>
            <p className="text-2xl font-bold text-primary">
              {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={handleAddToCart}
            className="w-full"
            size="lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ajouter au panier
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
