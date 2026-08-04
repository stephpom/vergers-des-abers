import { config } from "../config.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MIN_REQUEST_INTERVAL_MS = 1_000;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

let requestQueue = Promise.resolve();
let lastRequestAt = 0;

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

async function respectNominatimRateLimit() {
  const remainingDelay = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (remainingDelay > 0) {
    await wait(remainingDelay);
  }
  lastRequestAt = Date.now();
}

export async function geocodeSalesPoint(
  name: string,
  address: string,
): Promise<Coordinates | null> {
  const run = async () => {
    // Une enseigne absente d'OpenStreetMap peut empêcher une adresse pourtant valide
    // d'être trouvée. Chercher d'abord l'adresse seule, puis le libellé complet.
    for (const query of [address.trim(), `${name} ${address}`.trim()]) {
      await respectNominatimRateLimit();
      const url = new URL(NOMINATIM_URL);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "fr");
      url.searchParams.set("q", query);

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "fr",
          "User-Agent": `happy-apple-shop/1.0 (${config.PUBLIC_SITE_URL})`,
        },
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        throw new Error(`Nominatim returned ${response.status}`);
      }

      const result: unknown = await response.json();
      if (!Array.isArray(result) || result.length === 0) continue;

      const latitude = Number(result[0]?.lat);
      const longitude = Number(result[0]?.lon);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }

    return null;
  };

  const result = requestQueue.then(run, run);
  requestQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
