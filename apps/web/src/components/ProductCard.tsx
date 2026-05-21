import { Link } from 'react-router-dom';
import { imageUrl, type ApiProduct } from '@/types/api';
import { stripHtml, truncate } from '@/lib/seo';

interface ProductCardProps {
  product: ApiProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const cover = product.images[0];
  const excerpt = product.description
    ? truncate(stripHtml(product.description), 100)
    : null;

  return (
    <Link to={`/produits/${product.slug}`} className="group block h-full">
      <div className="bg-background rounded-xl shadow-sm border border-border/50 hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden">
        <div className="aspect-square overflow-hidden rounded-t-xl bg-muted">
          {cover ? (
            <img
              src={imageUrl(cover.filename)}
              alt={cover.alt || product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Pas d'image
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-semibold mb-2 line-clamp-2">{product.title}</h3>
          {excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
              {excerpt}
            </p>
          )}
          <span className="mt-auto text-sm font-medium text-primary group-hover:underline">
            Voir la fiche →
          </span>
        </div>
      </div>
    </Link>
  );
};
