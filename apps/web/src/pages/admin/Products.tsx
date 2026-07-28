import { SEO } from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { imageUrl, type ApiProduct } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSectionSwitcher from "@/components/admin/AdminSectionSwitcher";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/product-category";
import { PRODUCT_FORMAT_LABELS } from "@/lib/product-format";

const AdminProducts = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api<{ products: ApiProduct[] }>("/api/admin/products"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Administration" noindex />
      <AdminHeader
        title="Administration"
        rightAction={
          <>
            <p className="text-xs text-muted-foreground text-right">{user?.email}</p>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </>
        }
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Produits</h2>
            <Link to="/admin/produits/nouveau">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </Link>
          </div>
          <AdminSectionSwitcher />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data?.products.length ? (
          <div className="text-center py-20 border rounded-lg border-dashed">
            <p className="text-muted-foreground mb-4">Aucun produit pour l'instant.</p>
            <Link to="/admin/produits/nouveau">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier produit
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden h-[60vh] md:h-[70vh] flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-full">
                <thead className="bg-muted/30 text-sm sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 w-20">Image</th>
                    <th className="text-left p-3">Titre</th>
                    <th className="text-left p-3 w-52">Catégorie</th>
                    <th className="text-left p-3 w-32">Statut</th>
                    <th className="text-right p-3 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/20">
                      <td className="p-3">
                        {p.images[0] ? (
                          <img
                            src={imageUrl(p.images[0].filename)}
                            alt={p.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        <div>{PRODUCT_CATEGORY_LABELS[p.category ?? "JUICE"]}</div>
                        {p.formats?.length > 0 && (
                          <div className="mt-1 text-xs">
                            {p.formats.map((format) => PRODUCT_FORMAT_LABELS[format]).join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {p.published ? (
                          <Badge>Publié</Badge>
                        ) : (
                          <Badge variant="secondary">Brouillon</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link to={`/admin/produits/${p.id}`}>
                            <Button size="sm" variant="ghost" aria-label="Modifier">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" aria-label="Supprimer">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  « {p.title} » et toutes ses images seront définitivement
                                  supprimés.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProducts;
