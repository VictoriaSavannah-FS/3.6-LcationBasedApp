// import * as Location from "expo-location";
// jsut reuse my own getUserLcation alrady previosly created

import { getUserLocation } from "../services/location";
import axios from "axios";

//
export interface Place {
  id: string;
  name: string;
  category: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  distance?: number;
}

export interface PlaceSearchOptions {
  category?: string; // ex: "restaurant", "cafe", "shop"
  radius?: number; // meters ??
  minRating?: number; // "??
  limit?: number; // 1..50 (Mapbox docs recommend <= 10; 50 max for safety)
  signal?: AbortSignal; // can cencel X
}

class NearbyPlacesService {
  private apiKey: string;
  private baseUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** -- Get current user location @services/lcoatin --- */
  async getCurrentLocation(): Promise<{
    coords: { latitude: number; longitude: number };
    timestamp: number;
  }> {
    const { latitude, longitude } = await getUserLocation();
    return {
      coords: { latitude, longitude },
      timestamp: Date.now(),
    };
  }

  /** Search POIs near coordinates. Note: Mapbox uses `proximity` to *bias* results, not hard radius filtering. */

  async searchNearbyPlaces(
    coordinates: { latitude: number; longitude: number },
    options: PlaceSearchOptions = {}
  ): Promise<Place[]> {
    const {
      category = "restaurant",
      radius = 1000,
      limit = 20,
      // minRating ignored for Mapbox;
      signal,
    } = options;

    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
    const safeCategory = encodeURIComponent(category);

    try {
      const res = await axios.get(`${this.baseUrl}/${safeCategory}.json`, {
        params: {
          proximity: `${coordinates.longitude},${coordinates.latitude}`,
          access_token: this.apiKey,
          limit: safeLimit,
          radius, // not enforced by Mapbox Geocoding, but harmless as a hint
          types: "poi", // return Points of Interest
        },
        timeout: 10_000,
        signal,
      });

      const features: any[] = res.data?.features ?? [];

      const places = features.map((f) => {
        const lng = f?.center?.[0];
        const lat = f?.center?.[1];

        const place: Place = {
          id: String(f?.id ?? ""),
          name: String(f?.text ?? f?.place_name ?? "Unknown"),
          category: String(f?.properties?.category ?? category),
          coordinates: {
            latitude: typeof lat === "number" ? lat : 0,
            longitude: typeof lng === "number" ? lng : 0,
          },
          address: String(f?.place_name ?? ""),
          // Mapbox places features generally don't include ratings/price directly
          rating: undefined,
          priceLevel: undefined,
          photos: undefined,
        };

        place.distance = this.calculateDistance(coordinates, place.coordinates);
        return place;
      });

      // Sort closest-first
      return places.sort(
        (a, b) =>
          (a.distance ?? Number.POSITIVE_INFINITY) -
          (b.distance ?? Number.POSITIVE_INFINITY)
      );
    } catch (e: any) {
      // use the correct variable name
      if (axios.isCancel(e)) {
        throw new Error("Request cancelled");
      }
      const status = e?.response?.status;
      const detail = e?.message ?? "Unknown error";
      console.error("Places search error:", status, detail);
      throw new Error(`Failed to search nearby places: ${detail}`);
    }
  }

  /**
   * Fetch details for a place.
   */
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
      // Fallback approach: Mapbox doesn't support id-only lookup here.
      // We can try querying the id as text; results may differ.
      const res = await axios.get(
        `${this.baseUrl}/${encodeURIComponent(placeId)}.json`,
        {
          params: {
            access_token: this.apiKey,
            types: "poi",
            limit: 1,
          },
          timeout: 10_000,
        }
      );

      const feature = res.data?.features?.[0];
      if (!feature) return null;

      return {
        id: String(feature.id ?? placeId),
        name: String(feature.text ?? feature.place_name ?? "Unknown"),
        category: String(feature.properties?.category ?? "poi"),
        coordinates: {
          latitude: feature.center?.[1] ?? 0,
          longitude: feature.center?.[0] ?? 0,
        },
        address: String(feature.place_name ?? ""),
        rating: undefined,
        priceLevel: undefined,
        photos: undefined,
        distance: undefined,
      };
    } catch (err) {
      console.error("Place details error:", err);
      return null;
    }
  }

  /** Haversine distance in meters */
  private calculateDistance(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number }
  ): number {
    const R = 6_371_000; // meters
    const dLat = this.toRad(b.latitude - a.latitude);
    const dLon = this.toRad(b.longitude - a.longitude);
    const lat1 = this.toRad(a.latitude);
    const lat2 = this.toRad(b.latitude);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);

    const h =
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default NearbyPlacesService;
