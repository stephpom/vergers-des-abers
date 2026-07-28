import { SEO } from "@/components/SEO";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductImagesSection from "@/components/admin/ProductImagesSection";
import { api, ApiError } from "@/lib/api";
import { type ApiProduct, type ApiProductImage } from "@/types/api";
import { toast } from "sonner";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/product-category";
import { PRODUCT_FORMAT_OPTIONS } from "@/lib/product-format";
import type { ProductFormat } from "@/types/api";

const schema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  slug: z.string().max(80).optional(),
  description: z.string().max(20000),
  category: z.enum(["JUICE", "KEFIR", "JAM_JELLY"]),
  formats: z.array(z.enum(["CL_33", "CL_75", "L_1"])),
  published: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const productToFormValues = (product: ApiProduct): FormValues => ({
  title: product.title,
  slug: product.slug,
  description: product.description,
  category: product.category ?? "JUICE",
  formats: product.formats ?? [],
  published: product.published,
});

const AdminProductForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const loadedProductId = useRef<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => api<{ product: ApiProduct }>(`/api/admin/products/${id}`),
    enabled: isEdit,
  });

  const images = useMemo(() => data?.product.images ?? [], [data?.product.images]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      category: "JUICE",
      formats: [],
      published: false,
    },
  });

  useEffect(() => {
    if (data?.product) {
      const productChanged = loadedProductId.current !== data.product.id;
      if (productChanged || !form.formState.isDirty) {
        form.reset(productToFormValues(data.product));
        loadedProductId.current = data.product.id;
      }
    }
  }, [data?.product, form, form.formState.isDirty]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        return api<{ product: ApiProduct }>(`/api/admin/products/${id}`, {
          method: "PATCH",
          body: values,
        });
      }
      return api<{ product: ApiProduct }>(`/api/admin/products`, {
        method: "POST",
        body: values,
      });
    },
    onMutate: async () => {
      if (isEdit) {
        await qc.cancelQueries({ queryKey: ["admin", "product", id] });
      }
    },
    onSuccess: (result) => {
      loadedProductId.current = result.product.id;
      qc.setQueryData<{ product: ApiProduct }>(["admin", "product", result.product.id], result);
      form.reset(productToFormValues(result.product));
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEdit ? "Produit mis à jour" : "Produit créé");
      if (!isEdit) navigate(`/admin/produits/${result.product.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Slug déjà utilisé", { description: "Choisis un autre slug." });
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    },
  });

  const uploadImage = async (file: File) => {
    if (!id) {
      toast.error("Crée d'abord le produit pour ajouter des images");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", form.getValues("title"));
      await api<{ image: ApiProductImage }>(`/api/admin/products/${id}/images`, {
        method: "POST",
        body: fd,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "product", id] });
      toast.success("Image ajoutée");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const reorderMutation = useMutation({
    mutationFn: (imageIds: string[]) =>
      api<{ images: ApiProductImage[] }>(`/api/admin/products/${id}/images/order`, {
        method: "PUT",
        body: { imageIds },
      }),
    onMutate: async (imageIds) => {
      await qc.cancelQueries({ queryKey: ["admin", "product", id] });
      const previous = qc.getQueryData<{ product: ApiProduct }>(["admin", "product", id]);
      if (previous) {
        const byId = new Map(previous.product.images.map((img) => [img.id, img]));
        const reordered = imageIds
          .map((imgId, position) => {
            const img = byId.get(imgId);
            return img ? { ...img, position } : null;
          })
          .filter((x): x is ApiProductImage => x !== null);
        qc.setQueryData(["admin", "product", id], {
          product: { ...previous.product, images: reordered },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["admin", "product", id], ctx.previous);
      toast.error("Erreur lors de la réorganisation");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product", id] });
    },
  });

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const ordered = [...images];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    reorderMutation.mutate(ordered.map((img) => img.id));
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const ordered = [images[index], ...images.filter((_, i) => i !== index)];
    reorderMutation.mutate(ordered.map((img) => img.id));
  };

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      api(`/api/admin/products/${id}/images/${imageId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product", id] });
      toast.success("Image supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const category = form.watch("category");
  const formats = form.watch("formats");

  const toggleFormat = (format: ProductFormat, checked: boolean) => {
    form.setValue(
      "formats",
      checked ? [...formats, format] : formats.filter((value) => value !== format),
      { shouldDirty: true },
    );
  };

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Administration" noindex />
      <AdminHeader
        title={isEdit ? "Modifier le produit" : "Nouveau produit"}
        leftAction={
          <Link to="/admin/produits">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" placeholder="auto-généré depuis le titre" {...form.register("slug")} />
            <p className="text-xs text-muted-foreground">
              Visible dans l'URL publique : /produits/
              <strong>{form.watch("slug") || "auto-genere"}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <select
              id="category"
              {...form.register("category", {
                onChange: (event) => {
                  if (event.target.value === "JAM_JELLY") {
                    form.setValue("formats", [], { shouldDirty: true });
                  }
                },
              })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {category !== "JAM_JELLY" && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Formats disponibles</legend>
              <p className="text-xs text-muted-foreground">
                Plusieurs formats peuvent être sélectionnés.
              </p>
              <div className="flex flex-wrap gap-4">
                {PRODUCT_FORMAT_OPTIONS.map((format) => (
                  <label key={format.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formats.includes(format.value)}
                      onChange={(event) => toggleFormat(format.value, event.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    {format.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={form.watch("description")}
              onChange={(html) => form.setValue("description", html, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="published"
              checked={form.watch("published")}
              onCheckedChange={(v) => form.setValue("published", v, { shouldDirty: true })}
            />
            <Label htmlFor="published">Publié (visible sur le site public)</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/produits")}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>

        {!isEdit && (
          <Card className="mt-12 border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Crée d'abord le produit pour pouvoir ajouter des images,
                <br />
                définir la photo principale et l'ordre d'affichage.
              </p>
            </CardContent>
          </Card>
        )}

        {isEdit && (
          <ProductImagesSection
            images={images}
            uploading={uploading}
            reorderPending={reorderMutation.isPending}
            onUploadClick={() => {}}
            onUploadFile={(file) => void uploadImage(file)}
            onDelete={(imageId) => deleteImageMutation.mutate(imageId)}
            onSetMain={setAsMain}
            onMove={moveImage}
          />
        )}
      </main>
    </div>
  );
};

export default AdminProductForm;
