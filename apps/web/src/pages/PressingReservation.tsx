import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import type { ApiAvailablePressingSlot, PressingRate } from "@/types/api";

const schema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(100),
  lastName: z.string().trim().min(2, "Nom requis").max(100),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (phone) => /^[+\d\s().-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 10,
      "Numéro de téléphone invalide",
    ),
  quantityKg: z.coerce
    .number()
    .int("Indiquez un nombre entier de kilogrammes")
    .min(300, "La quantité minimale est de 300 kg")
    .max(800, "La quantité maximale par créneau est de 800 kg"),
  rate: z.enum(["WITH_BOTTLES", "WITHOUT_BOTTLES"]),
  slotId: z.string().min(1, "Choisissez un créneau"),
});

type FormValues = z.infer<typeof schema>;

const formatSlot = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));

const PressingReservation = () => {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["pressing-status"],
    queryFn: () => api<{ enabled: boolean }>("/api/pressing/status"),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["pressing-slots"],
    queryFn: () => api<{ slots: ApiAvailablePressingSlot[] }>("/api/pressing/slots"),
    enabled: status?.enabled === true,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      quantityKg: 300,
      rate: "WITH_BOTTLES",
      slotId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api("/api/pressing/reservations", { method: "POST", body: values }),
    onSuccess: () => {
      setSubmitError(null);
      setSuccess(true);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["pressing-slots"] });
    },
    onError: (error) => {
      setSubmitError(
        error instanceof ApiError && error.status === 409
          ? "Ce créneau n'a plus assez de capacité. Choisissez-en un autre."
          : "La réservation n'a pas pu être enregistrée. Réessayez dans quelques instants.",
      );
    },
  });

  const slots = data?.slots ?? [];
  const selectedSlot = slots.find((slot) => slot.id === form.watch("slotId"));

  if (!isStatusLoading && !status?.enabled) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Pressage bientôt disponible" noindex />
        <PublicHeader />
        <main id="main-content" className="container mx-auto px-4 py-20">
          <Card className="mx-auto max-w-xl text-center">
            <CardContent className="space-y-4 py-12">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
              <h1 className="text-3xl font-bold">Les réservations ouvriront prochainement</h1>
              <p className="text-muted-foreground">
                L'atelier se prépare à accueillir les clients. Merci de revenir bientôt.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Réservation confirmée" noindex />
        <PublicHeader />
        <main id="main-content" className="container mx-auto px-4 py-20">
          <Card className="mx-auto max-w-xl text-center">
            <CardContent className="space-y-5 pt-10 pb-10">
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h1 className="text-3xl font-bold">Votre créneau est réservé</h1>
              <p className="text-muted-foreground">
                Nous vous contacterons par téléphone si nous avons besoin de précisions.
              </p>
              <Button onClick={() => setSuccess(false)}>Effectuer une autre réservation</Button>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Réserver un créneau de pressage"
        description="Réservez votre créneau de pressage de pommes à l'atelier Pom'Pom."
      />
      <PublicHeader />
      <main id="main-content" className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <CalendarDays className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Réserver un pressage</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Apportez vos pommes à l'atelier et participez à la production de votre propre jus,
              accompagné par notre équipe.
            </p>
            <p className="mt-3 text-lg text-muted-foreground">
              Le pressoir a une capacité de 800 kg par heure.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Nos tarifs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-primary/5 p-4">
                  <p className="font-semibold">Avec bouteille et capsule</p>
                  <p className="mt-1 text-2xl font-bold text-primary">1,50 € / L</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-semibold">Sans bouteille</p>
                  <p className="mt-1 text-2xl font-bold">1,10 € / L</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Le volume final dépend du rendement des pommes et sera constaté après pressage.
                </p>
                <div className="rounded-xl bg-muted p-4 text-sm">
                  <p className="font-semibold">Minimum de réservation : 300 kg</p>
                  <p className="mt-1 text-muted-foreground">
                    Vous n'avez pas assez de pommes ? Regroupez-vous avec d'autres clients pour
                    atteindre ensemble le volume minimum.
                  </p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold">Venez à deux pour participer</p>
                  <p className="mt-1 text-muted-foreground">
                    Deux personnes de votre groupe doivent être présentes pour participer au tri des
                    pommes et à l'embouteillage. Vous serez accompagnés par deux personnes de
                    l'atelier pendant toute la durée du pressage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
              </CardHeader>
              <CardContent>
                {isStatusLoading || isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="rounded-lg bg-muted p-6 text-center text-muted-foreground">
                    Aucun créneau n'est disponible pour le moment. Revenez prochainement.
                  </p>
                ) : (
                  <form
                    onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
                    className="space-y-5"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          autoComplete="given-name"
                          {...form.register("firstName")}
                        />
                        <p className="text-sm text-destructive">
                          {form.formState.errors.firstName?.message}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          autoComplete="family-name"
                          {...form.register("lastName")}
                        />
                        <p className="text-sm text-destructive">
                          {form.formState.errors.lastName?.message}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
                      <p className="text-sm text-destructive">
                        {form.formState.errors.phone?.message}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantityKg">Quantité de pommes (kg)</Label>
                      <Input
                        id="quantityKg"
                        type="number"
                        min={300}
                        max={selectedSlot?.remainingCapacityKg ?? 800}
                        {...form.register("quantityKg")}
                      />
                      {selectedSlot ? (
                        <p className="text-sm text-muted-foreground">
                          Il reste {selectedSlot.remainingCapacityKg} kg sur ce créneau.
                        </p>
                      ) : null}
                      <p className="text-sm text-destructive">
                        {form.formState.errors.quantityKg?.message}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slotId">Créneau</Label>
                      <select
                        id="slotId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...form.register("slotId")}
                      >
                        <option value="">Choisissez une date et une heure</option>
                        {slots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {formatSlot(slot.startsAt)} — {slot.remainingCapacityKg} kg disponibles
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-destructive">
                        {form.formState.errors.slotId?.message}
                      </p>
                    </div>

                    <fieldset className="space-y-3">
                      <legend className="text-sm font-medium">Tarif choisi</legend>
                      {(
                        [
                          ["WITH_BOTTLES", "Avec bouteille — 1,40 € / L"],
                          ["WITHOUT_BOTTLES", "Sans bouteille — 1 € / L"],
                        ] as Array<[PressingRate, string]>
                      ).map(([value, label]) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-4"
                        >
                          <input type="radio" value={value} {...form.register("rate")} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </fieldset>

                    {submitError ? (
                      <p
                        role="alert"
                        className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                      >
                        {submitError}
                      </p>
                    ) : null}

                    <p className="text-xs text-muted-foreground">
                      Vos coordonnées sont utilisées uniquement pour gérer votre réservation.{" "}
                      <Link to="/confidentialite" className="underline hover:text-primary">
                        En savoir plus sur vos données personnelles
                      </Link>
                      .
                    </p>

                    <Button type="submit" className="w-full" disabled={mutation.isPending}>
                      {mutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Confirmer la réservation
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default PressingReservation;
