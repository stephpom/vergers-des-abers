import { Globe2, MapPin, Store, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

interface SalePoint {
  id: string;
  name: string;
  address: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
}

const iconMap: Record<string, LucideIcon> = {
  store: Store,
  map: MapPin,
};

const defaultCenter: [number, number] = [48.3, -4.5];

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, map, zoom]);

  return null;
}

export const CarteVenteSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["sales-points"],
    queryFn: () => api<{ salesPoints: SalePoint[] }>("/api/sales-points"),
    retry: false,
  });

  const places = useMemo(() => data?.salesPoints ?? [], [data?.salesPoints]);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const coordinatesByPlaceId = useMemo(
    () =>
      Object.fromEntries(
        places
          .filter((place) => place.latitude != null && place.longitude != null)
          .map((place) => [place.id, [place.latitude!, place.longitude!]]),
      ) as Record<string, [number, number]>,
    [places],
  );

  const selectedPlace = activePlaceId ? places.find((place) => place.id === activePlaceId) : null;
  const selectedCoordinates = useMemo(() => {
    if (!selectedPlace) {
      return null;
    }
    return coordinatesByPlaceId[selectedPlace.id] ?? null;
  }, [coordinatesByPlaceId, selectedPlace]);

  const visiblePlaces = useMemo(
    () => places.filter((place) => coordinatesByPlaceId[place.id]),
    [coordinatesByPlaceId, places],
  );

  const mapStatusMessage = isLoading
    ? "Chargement de la carte…"
    : places.length > 0 && visiblePlaces.length === 0
      ? "Aucun point de vente ne dispose de coordonnées."
      : null;

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
          <div className="overflow-hidden rounded-3xl border border-border/70 shadow-sm bg-white">
            <div className="relative min-h-[420px] w-full">
              <MapContainer
                center={selectedCoordinates ?? defaultCenter}
                zoom={selectedCoordinates ? 13 : 8}
                className="h-[420px] w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedCoordinates ? (
                  <MapController center={selectedCoordinates} zoom={13} />
                ) : null}
                {visiblePlaces.map((place) => {
                  const position = coordinatesByPlaceId[place.id];
                  if (!position) {
                    return null;
                  }

                  return (
                    <Marker key={place.id} position={position} icon={defaultIcon}>
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-semibold">{place.name}</p>
                          <p className="text-sm text-muted-foreground">{place.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              {mapStatusMessage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 p-6 text-center text-sm text-muted-foreground">
                  {mapStatusMessage}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm text-muted-foreground">
                Chargement des points de vente…
              </div>
            ) : places.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm text-muted-foreground">
                Aucun point de vente n&apos;est actuellement disponible.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto pr-2">
                <div className="space-y-3">
                  {places.map((place, index) => {
                    const Icon = iconMap[index % 2 === 0 ? "store" : "map"];
                    return (
                      <button
                        key={`${place.name}-${index}`}
                        type="button"
                        onClick={() => setActivePlaceId(place.id)}
                        className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                          place.id === activePlaceId
                            ? "border-primary bg-primary/5"
                            : "border-border/70 bg-white hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold">{place.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{place.address}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-3">
                              {place.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
