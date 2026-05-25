import { useRef } from "react";
import { ChevronDown, ChevronUp, Loader2, Star, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { imageUrl, type ApiProductImage } from "@/types/api";

interface ProductImagesSectionProps {
  images: ApiProductImage[];
  uploading: boolean;
  reorderPending: boolean;
  onUploadClick: () => void;
  onUploadFile?: (file: File) => void;
  onDelete: (imageId: string) => void;
  onSetMain: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

const ProductImagesSection = ({
  images,
  uploading,
  reorderPending,
  onUploadClick,
  onUploadFile,
  onDelete,
  onSetMain,
  onMove,
}: ProductImagesSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    onUploadClick();
  };

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold">Images</h2>
        {images.length > 1 && (
          <p className="text-xs text-muted-foreground">
            La première image est la photo principale (visible en couverture sur le site).
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {images.map((img, index) => {
          const isMain = index === 0;
          return (
            <div key={img.id} className="space-y-2">
              <div className="relative group">
                <img
                  src={imageUrl(img.filename)}
                  alt={img.alt}
                  className={`w-full aspect-square object-cover rounded-md border ${
                    isMain ? "ring-2 ring-primary" : ""
                  }`}
                />
                {isMain && (
                  <Badge className="absolute top-2 left-2 gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principale
                  </Badge>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => onDelete(img.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  aria-label="Supprimer l'image"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-1 justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={isMain || reorderPending}
                  onClick={() => onSetMain(index)}
                  aria-label="Définir comme principale"
                  title="Définir comme principale"
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === 0 || reorderPending}
                  onClick={() => onMove(index, -1)}
                  aria-label="Déplacer avant"
                  title="Déplacer avant"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === images.length - 1 || reorderPending}
                  onClick={() => onMove(index, 1)}
                  aria-label="Déplacer après"
                  title="Déplacer après"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onUploadFile) void onUploadFile(file);
        }}
      />
      <Button type="button" variant="outline" onClick={handleUploadClick} disabled={uploading}>
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        Ajouter une image
      </Button>
      <p className="text-xs text-muted-foreground mt-2">JPEG / PNG / WebP, 5 Mo max.</p>
    </section>
  );
};

export default ProductImagesSection;
