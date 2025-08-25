// hooks/useNearbyPlaces.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import NearbyPlacesService, {
  PlaceSearchOptions,
} from "../services/nearbyPlacesService";
import Constants from "expo-constants";

// robust loader supports both MAPBOX_TOKEN and mapboxToken in app.json
const extra =
  (Constants.expoConfig?.extra as any) ??
  ((Constants as any).manifest?.extra as any) ??
  {};

export const MAPBOX_API_KEY: string =
  extra.MAPBOX_TOKEN ?? extra.mapboxToken ?? "";

console.log(
  "Mapbox token present?",
  !!MAPBOX_API_KEY,
  MAPBOX_API_KEY.startsWith("pk.") ? "pk..." : MAPBOX_API_KEY
);

// --- fetch nearby places logic ---
export const useNearbyPlaces = () => {
  // Sate->Holds current user location object(data)
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  // LOCATION --- states storage/loading/error
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // fethc--> Extr search options
  const [searchOptions, setSearchOptions] = useState<PlaceSearchOptions>({});

  // Service instance that wraps Mapbox calls -- had to askk...
  const placesService = new NearbyPlacesService(MAPBOX_API_KEY);

  // --- REACT QUERY --------
  // Handles fetching + caching of nearby places
  const {
    data: places = [], // default to [] so UI never breaks
    isFetching: placesLoading,
    error: placesError,
  } = useQuery({
    // Querykey ==>location + search options^^^
    queryKey: ["nearby-places", currentLocation?.coords, searchOptions],
    // NOTE: v5 queryFn receives an AbortSignal; forward it to the service
    queryFn: async ({ signal }) => {
      if (!currentLocation?.coords)
        throw new Error("Location required for places search");

      // use Service=> call => fetch Mapbox data
      return placesService.searchNearbyPlaces(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        { ...searchOptions, signal } // ← pass signal so requests cancel cleanly
      );
    },
    // don’t run UNTIL coords
    enabled: !!currentLocation?.coords,
    retry: 1, // one retry max if it fails
    staleTime: 5 * 60 * 1000, // cache valid for 5 mins
  });

  // --- ACTIONS ---

  // Force refresh of the current location
  const refreshLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      // Grab coords (uses your service/location.ts logic now)
      const loc = await placesService.getCurrentLocation();
      setCurrentLocation(loc);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Location unavailable";
      setLocationError(message);
      console.error("Location error:", err);
    } finally {
      setLocationLoading(false);
    }
  }, [placesService]);

  // Update search options ~ React Query will auto-refetch because queryKey changes
  const searchPlaces = useCallback((options: PlaceSearchOptions = {}) => {
    setSearchOptions(options);
    // refetch(); // ← not needed; queryKey includes searchOptions so it auto-runs
  }, []);

  // Fetch details for a specific place by ID
  const getPlaceDetails = useCallback(
    async (placeId: string) => {
      try {
        return await placesService.getPlaceDetails(placeId);
      } catch (e) {
        console.error("Place details error:", e);
        return null;
      }
    },
    [placesService]
  );

  // --- EFFECTS ---

  // On mount → get initial location
  useEffect(() => {
    refreshLocation(); // calls your getUserLocation internally
  }, [refreshLocation]);

  // When coords are set → trigger a default search automatically
  useEffect(() => {
    if (currentLocation?.coords) {
      searchPlaces({ category: "restaurant", limit: 20 });
    }
  }, [currentLocation?.coords, searchPlaces]);

  // --- RETURN API ---
  return {
    currentLocation,
    locationLoading,
    locationError,
    places,
    placesLoading,
    // make sure error is a clean string for the UI
    placesError: placesError instanceof Error ? placesError.message : null,
    refreshLocation,
    searchPlaces,
    getPlaceDetails,
  };
};
