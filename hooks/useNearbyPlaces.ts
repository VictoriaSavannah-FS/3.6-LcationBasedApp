import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import Constants from "expo-constants";
import NearbyPlacesService, {
  Place,
  PlaceSearchOptions,
} from "../services/nearbyPlacesService";

// Prefer pulling from app.json -> expo.extra.mapboxToken, with fallback string
// const MAPBOX_API_KEY =
//   (Constants.expoConfig?.extra as any)?.mapboxToken || "pk.eyJ1Ijoic2N2aWN0b3JpYSIsImEiOiJjbHozZWIzaTUxd3JpMmtwdnZwMHdheDF1In0.2-QCTp7ZOL-HlLkXm4vsvw"";

const MAPBOX_API_KEY =
  (Constants.expoConfig?.extra as any)?.mapboxToken ??
  process.env.MAPBOX_TOKEN ??
  "";

export interface UseNearbyPlacesReturn {
  // Location state
  currentLocation: Location.LocationObject | null;
  locationLoading: boolean;
  locationError: string | null;

  // Places state
  places: Place[];
  placesLoading: boolean;
  placesError: string | null;

  // Actions
  refreshLocation: () => Promise<void>;
  searchPlaces: (options?: PlaceSearchOptions) => void;
  getPlaceDetails: (placeId: string) => Promise<Place | null>;
}

export const useNearbyPlaces = (): UseNearbyPlacesReturn => {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchOptions, setSearchOptions] = useState<PlaceSearchOptions>({});

  const placesService = new NearbyPlacesService(MAPBOX_API_KEY);

  // v5 object-style useQuery
  const {
    data: places = [],
    isPending, // v5: replaces isLoading
    error,
    refetch: refetchPlaces,
  } = useQuery({
    queryKey: ["nearby-places", currentLocation?.coords, searchOptions],
    queryFn: async () => {
      if (!currentLocation?.coords) {
        throw new Error("Location required for places search");
      }
      return placesService.searchNearbyPlaces(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        searchOptions
      );
    },
    enabled: !!currentLocation?.coords,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      const location = await placesService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Location unavailable";
      setLocationError(msg);
      console.error("Location error:", err);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const searchPlaces = useCallback(
    (options: PlaceSearchOptions = {}) => {
      setSearchOptions(options);
      // queryKey changes when searchOptions changes, but refetch is fine for immediacy
      refetchPlaces();
    },
    [refetchPlaces]
  );

  const getPlaceDetails = useCallback(async (placeId: string) => {
    try {
      return await placesService.getPlaceDetails(placeId);
    } catch (err) {
      console.error("Place details error:", err);
      return null;
    }
  }, []);

  // Initial location fetch
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    currentLocation,
    locationLoading,
    locationError,
    places,
    placesLoading: isPending,
    placesError: (error as Error | undefined)?.message || null,
    refreshLocation,
    searchPlaces,
    getPlaceDetails,
  };
};
