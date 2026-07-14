import { Globe2, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Place {
  icon: LucideIcon;
  name: string;
  address: string;
  description: string;
}

const PLACES: Place[] = [
  {
    icon: Store,
    name: "Vergers des Abers",
    address: "592 Lanvaon, 29880 Plouguerneau",
    description: "Retrouvez nos jus frais directement à la ferme, dans le nord Finistère.",
  },
  {
    icon: Store,
    name: "L'Artichaut",
    address: "22c rue de Lannilis, 29880 Plouguerneau",
    description: "Magasin de producteurs sur Plouguerneau",
  },
  {
    icon: Store,
    name: "Épicerie de Lilia",
    address: "16 Hent Treaz, 29880 Plouguerneau",
    description: "L'épicerie de Lilia où découvrir notre gamme de jus artisanaux.",
  },
];

const mapQuery = encodeURIComponent(
  PLACES.map((place) => `${place.name} ${place.address}`).join(" | "),
);
const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&hl=fr&z=10&output=embed`;

export const CarteVenteSection = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Où trouver nos produits ?</h2>
          <p className="text-lg text-muted-foreground mt-4">
            Retrouvez tous les points de vente où nos produits sont disponibles en Bretagne. La
            carte ci-dessous vous aide à localiser nos partenaires et points de retrait.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="overflow-hidden rounded-3xl border border-border/70 shadow-sm">
            <iframe
              title="Carte des points de vente Pom'Pom"
              src={mapSrc}
              className="w-full min-h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="space-y-6">
            {PLACES.map((place) => {
              const Icon = place.icon;
              return (
                <div
                  key={place.name}
                  className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">{place.address}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{place.description}</p>
                </div>
              );
            })}
            <div className="rounded-3xl border border-border/70 bg-primary/5 p-6">
              <div className="flex items-center gap-3 mb-3 text-primary">
                <Globe2 className="w-5 h-5" />
                <p className="font-semibold">Besoin d&apos;aide pour trouver un point de vente ?</p>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Contactez-nous pour obtenir l&apos;adresse exacte de nos prochaines distributions ou
                pour ajouter un point de vente près de chez vous.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
