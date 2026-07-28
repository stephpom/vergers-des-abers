import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSectionSwitcher from "@/components/admin/AdminSectionSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiPressingSlot } from "@/types/api";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));

const rateLabel = {
  WITH_BOTTLES: "Avec bouteille — 1,40 € / L",
  WITHOUT_BOTTLES: "Sans bouteille — 1 € / L",
};

const AdminPressingSlots = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();
  const [startsAt, setStartsAt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pressing-slots"],
    queryFn: () => api<{ slots: ApiPressingSlot[] }>("/api/admin/pressing/slots"),
  });
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["admin", "pressing-settings"],
    queryFn: () => api<{ enabled: boolean }>("/api/admin/pressing/settings"),
  });

  const settingsMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      api<{ enabled: boolean }>("/api/admin/pressing/settings", {
        method: "PATCH",
        body: { enabled },
      }),
    onSuccess: ({ enabled }) => {
      queryClient.setQueryData(["admin", "pressing-settings"], { enabled });
      queryClient.invalidateQueries({ queryKey: ["pressing-status"] });
      queryClient.invalidateQueries({ queryKey: ["pressing-slots"] });
      toast.success(enabled ? "Réservations ouvertes au public" : "Réservations désactivées");
    },
    onError: () => toast.error("Impossible de modifier la visibilité de la page"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api("/api/admin/pressing/slots", {
        method: "POST",
        body: { startsAt: new Date(startsAt).toISOString() },
      }),
    onSuccess: () => {
      setStartsAt("");
      queryClient.invalidateQueries({ queryKey: ["admin", "pressing-slots"] });
      queryClient.invalidateQueries({ queryKey: ["pressing-slots"] });
      toast.success("Créneau ajouté");
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Un créneau existe déjà à cette heure"
          : "Impossible d'ajouter le créneau",
      ),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/pressing/slots/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pressing-slots"] });
      queryClient.invalidateQueries({ queryKey: ["pressing-slots"] });
      toast.success("Créneau supprimé");
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Supprimez d'abord les réservations de ce créneau"
          : "Impossible de supprimer le créneau",
      ),
  });

  const deleteReservationMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/pressing/reservations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pressing-slots"] });
      queryClient.invalidateQueries({ queryKey: ["pressing-slots"] });
      toast.success("Réservation supprimée");
    },
    onError: () => toast.error("Impossible de supprimer la réservation"),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Administration - Créneaux de pressage" noindex />
      <AdminHeader
        title="Créneaux de pressage"
        leftAction={
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        }
        rightAction={
          <>
            <p className="text-right text-xs text-muted-foreground">{user?.email}</p>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </>
        }
      />

      <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        <AdminSectionSwitcher />

        <section className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Réservations publiques</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings?.enabled
                  ? "La page est visible et les clients peuvent réserver."
                  : "La page est désactivée et aucune réservation ne peut être enregistrée."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="pressing-enabled">{settings?.enabled ? "Ouvertes" : "Fermées"}</Label>
              <Switch
                id="pressing-enabled"
                checked={settings?.enabled ?? false}
                disabled={isSettingsLoading || settingsMutation.isPending}
                onCheckedChange={(enabled) => settingsMutation.mutate(enabled)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Ajouter un créneau d'une heure</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque créneau peut accueillir jusqu'à 800 kg de pommes.
          </p>
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (startsAt) createMutation.mutate();
            }}
          >
            <div className="w-full max-w-sm space-y-2">
              <Label htmlFor="startsAt">Date et heure</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                required
                min={new Date().toISOString().slice(0, 16)}
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={!startsAt || createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Ajouter
            </Button>
          </form>
        </section>

        <section className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !data?.slots.length ? (
            <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              Aucun créneau créé.
            </p>
          ) : (
            data.slots.map((slot) => {
              const reservedKg = slot.reservations.reduce(
                (total, reservation) => total + reservation.quantityKg,
                0,
              );
              return (
                <article key={slot.id} className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold capitalize">
                        {formatDate(slot.startsAt)}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {reservedKg} kg réservés · {slot.capacityKg - reservedKg} kg disponibles
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={slot.reservations.length > 0 || deleteSlotMutation.isPending}
                      onClick={() => deleteSlotMutation.mutate(slot.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer le créneau
                    </Button>
                  </div>

                  {slot.reservations.length === 0 ? (
                    <p className="mt-5 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                      Aucune réservation.
                    </p>
                  ) : (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="border-b text-muted-foreground">
                          <tr>
                            <th className="pb-3 font-medium">Client</th>
                            <th className="pb-3 font-medium">Téléphone</th>
                            <th className="pb-3 font-medium">Quantité</th>
                            <th className="pb-3 font-medium">Tarif</th>
                            <th className="pb-3 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slot.reservations.map((reservation) => (
                            <tr key={reservation.id} className="border-b last:border-0">
                              <td className="py-3 font-medium">
                                {reservation.firstName} {reservation.lastName}
                              </td>
                              <td className="py-3">
                                <a className="hover:text-primary" href={`tel:${reservation.phone}`}>
                                  {reservation.phone}
                                </a>
                              </td>
                              <td className="py-3">{reservation.quantityKg} kg</td>
                              <td className="py-3">{rateLabel[reservation.rate]}</td>
                              <td className="py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deleteReservationMutation.isPending}
                                  onClick={() => deleteReservationMutation.mutate(reservation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Supprimer la réservation</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPressingSlots;
