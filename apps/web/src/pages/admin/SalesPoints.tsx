import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSectionSwitcher from "@/components/admin/AdminSectionSwitcher";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ApiSalesPoint } from "@/types/api";

const schema = z
  .object({
    name: z.string().min(1, "Nom requis").max(200),
    address: z.string().min(1, "Adresse requise").max(500),
    description: z.string().max(20000),
    latitude: z
      .string()
      .refine(
        (value) =>
          value.trim() === "" ||
          (!Number.isNaN(Number(value)) && Number(value) >= -90 && Number(value) <= 90),
        "Latitude comprise entre -90 et 90",
      ),
    longitude: z
      .string()
      .refine(
        (value) =>
          value.trim() === "" ||
          (!Number.isNaN(Number(value)) && Number(value) >= -180 && Number(value) <= 180),
        "Longitude comprise entre -180 et 180",
      ),
    published: z.boolean(),
  })
  .refine((values) => (values.latitude.trim() === "") === (values.longitude.trim() === ""), {
    message: "Renseignez la latitude et la longitude ensemble",
    path: ["longitude"],
  });

type FormValues = z.infer<typeof schema>;

const AdminSalesPoints = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "sales-points"],
    queryFn: () => api<{ salesPoints: ApiSalesPoint[] }>("/api/admin/sales-points"),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      address: "",
      description: "",
      latitude: "",
      longitude: "",
      published: true,
    },
  });

  useEffect(() => {
    if (!editingId) {
      form.reset({
        name: "",
        address: "",
        description: "",
        latitude: "",
        longitude: "",
        published: true,
      });
    }
  }, [editingId, form]);

  const resetForm = () => {
    setEditingId(null);
    form.reset({
      name: "",
      address: "",
      description: "",
      latitude: "",
      longitude: "",
      published: true,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editingId) {
        return api<{ salesPoint: ApiSalesPoint }>(`/api/admin/sales-points/${editingId}`, {
          method: "PATCH",
          body: values,
        });
      }

      return api<{ salesPoint: ApiSalesPoint }>("/api/admin/sales-points", {
        method: "POST",
        body: values,
      });
    },
    onSuccess: ({ salesPoint }) => {
      qc.invalidateQueries({ queryKey: ["admin", "sales-points"] });
      qc.invalidateQueries({ queryKey: ["sales-points"] });
      if (salesPoint.latitude == null || salesPoint.longitude == null) {
        toast.warning(
          "Point enregistré, mais l’adresse n’a pas pu être géolocalisée. Renseignez ses coordonnées manuellement.",
        );
      } else {
        toast.success(editingId ? "Point de vente mis à jour" : "Point de vente créé");
      }
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/sales-points/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sales-points"] });
      qc.invalidateQueries({ queryKey: ["sales-points"] });
      toast.success("Point de vente supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const startEdit = (salesPoint: ApiSalesPoint) => {
    setEditingId(salesPoint.id);
    form.reset({
      name: salesPoint.name,
      address: salesPoint.address,
      description: salesPoint.description,
      latitude: salesPoint.latitude?.toString() ?? "",
      longitude: salesPoint.longitude?.toString() ?? "",
      published: salesPoint.published,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Administration - Points de vente" noindex />
      <AdminHeader
        title="Points de vente"
        leftAction={
          <Link to="/admin/produits">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
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

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <AdminSectionSwitcher className="mb-6" />

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="border rounded-lg bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingId ? "Modifier le point de vente" : "Ajouter un point de vente"}
              </h2>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>

            <form
              onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" {...form.register("address")} />
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Informations complémentaires"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="48.4545"
                    {...form.register("latitude")}
                  />
                  {form.formState.errors.latitude && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.latitude.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="-2.0418"
                    {...form.register("longitude")}
                  />
                  {form.formState.errors.longitude && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.longitude.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Facultatif : si les deux champs sont vides, les coordonnées sont calculées à partir
                de l’adresse lors de l’enregistrement.
              </p>

              <div className="flex items-center gap-3">
                <Switch
                  id="published"
                  checked={form.watch("published")}
                  onCheckedChange={(value) =>
                    form.setValue("published", value, { shouldDirty: true })
                  }
                />
                <Label htmlFor="published">Publié</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Enregistrer" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Réinitialiser
                </Button>
              </div>
            </form>
          </section>

          <section className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !data?.salesPoints.length ? (
              <div className="text-center py-20 text-muted-foreground">
                <Plus className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Aucun point de vente pour le moment.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/30 text-sm">
                  <tr>
                    <th className="text-left p-3">Nom</th>
                    <th className="text-left p-3">Adresse</th>
                    <th className="text-left p-3 w-40">Coordonnées</th>
                    <th className="text-left p-3 w-32">Statut</th>
                    <th className="text-right p-3 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesPoints.map((salesPoint) => (
                    <tr key={salesPoint.id} className="border-t hover:bg-muted/20 align-top">
                      <td className="p-3">
                        <div className="font-medium">{salesPoint.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {salesPoint.description || "—"}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{salesPoint.address}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {salesPoint.latitude != null && salesPoint.longitude != null ? (
                          <span>
                            {salesPoint.latitude}, {salesPoint.longitude}
                          </span>
                        ) : (
                          <Badge variant="destructive">À renseigner</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {salesPoint.published ? (
                          <Badge>Publié</Badge>
                        ) : (
                          <Badge variant="secondary">Masqué</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Modifier"
                            onClick={() => startEdit(salesPoint)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" aria-label="Supprimer">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce point de vente ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  « {salesPoint.name} » sera définitivement retiré de l’admin et du
                                  site public.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(salesPoint.id)}
                                >
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
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminSalesPoints;
