// services/mapboxService.ts
import Constants from "expo-constants";
import type { Coords } from "./location";

// get token each time we need it (also check EXPO_PUBLIC_ var as a web fallback)
const getToken = () =>
  Constants.expoConfig?.extra?.mapboxToken ??
  (process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string | undefined);
/** Build a Static Image URL - from MApbox DOc */

// def. types ----------

// REVERSE GEOCOde--- TYPES----
export type RevGeoCodeRes = {
  id: string;
  placeName: string; // So wE humans can REad!
  context: any[]; // Country/region/place adta
} | null; //null of NO/ data rtrn

export function staticMapUrl({
  // ref. to location.ts params -wil/pass the fetched data
  latitude,
  longitude,

  zoom = 13,
  width = 600,
  height = 400,
  style = "dark-v11", // like Style!
  marker = true,
}: Coords & {
  // eftch actual data
  zoom?: number;
  width?: number;
  height?: number;
  style?: string;
  marker?: boolean;
}): string | null {
  // refe to Token@ ,env
  const MAPBOX_TOKEN = getToken();
  // IF token missing -- Alert
  if (!MAPBOX_TOKEN) {
    console.warn(
      "Missing Mapbox token (expo.extra.mapboxToken or EXPO_PUBLIC_MAPBOX_TOKEN)"
    );
    return null;
  }

  // had to add null
  // chat error/hndling
  if (!MAPBOX_TOKEN) {
    console.warn("about:blank"); //so not CRASHING!!
    return null;
  }
  //   fethc + return data
  const base = `https://api.mapbox.com/styles/v1/mapbox/${style}/static`;
  const markerPart = marker ? `/pin-s+ff0000(${longitude},${latitude})` : "";
  const centerPart = `/${longitude},${latitude},${zoom},0`;
  const sizePart = `/${Math.round(width)}x${Math.round(height)}@2x`;
  const tokenPart = `?access_token=${MAPBOX_TOKEN}`;
  return `${base}${markerPart}${centerPart}${sizePart}${tokenPart}`;
}

/** ---------- --Reverse geocode ------- human readable - */

export async function reverseGeocode(
  // pass lat/lon data from Coords --> pass to url values+key to fetch
  { latitude, longitude }: Coords,
  lang: string = "en" //type-cEHcks*
): Promise<RevGeoCodeRes> {
  const MAPBOX_TOKEN = getToken(); // passData
  if (!MAPBOX_TOKEN) throw new Error("No Mapbox token configured.");
  // catcth error/hndling
  if (!MAPBOX_TOKEN) {
    throw new Error(
      "Mapbox reverse geocode failed -- doublecheck MApbox Key..."
    );
  }
  //   pass lat/lon data on API call
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${longitude},${latitude}.json?language=${lang}&access_token=${MAPBOX_TOKEN}`;
  // logic - IF NOT -> throw erroe
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox reverse geocode failed (${res.status})`);
  const json = await res.json();

  // fetching "feature" INSIDE the GeoCodeJSON to
  const feature = json.features?.[0];
  if (!feature) return null; // If NOT MATCH <<<======

  return {
    id: feature.id as string,
    placeName: feature.place_name as string,
    context: feature.context ?? [],
  };
}
