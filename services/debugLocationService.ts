import * as Location from "expo-location";
import locationDebugger from "../utils/debugLocation";

export interface WeatherLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  address?: string;
  timestamp: number;
  source: "gps" | "network" | "cache" | "manual";
}

// helper --type safety for errors--
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  // Some libraries throw non-Error values
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
class DebugLocationService {
  private static instance: DebugLocationService;
  private currentLocation: WeatherLocation | null = null;
  private locationCache: Map<string, WeatherLocation> = new Map();
  public static getInstance(): DebugLocationService {
    if (!DebugLocationService.instance) {
      DebugLocationService.instance = new DebugLocationService();
    }
    return DebugLocationService.instance;
  }
  async getCurrentLocationWithDebug(): Promise<WeatherLocation> {
    locationDebugger.logLocationEvent(
      "getCurrentLocation",
      { latitude: 0, longitude: 0 },
      {
        errors: ["Starting location request"],
      }
    );
    try {
      // Check permissions first
      const permissionResult = await this.checkPermissionsWithDebug();
      if (!permissionResult.granted) {
        throw new Error(
          `Location permission denied: ${permissionResult.status}`
        );
      }
      // Try to get high-accuracy location first
      locationDebugger.logLocationEvent(
        "permission_check",
        { latitude: 0, longitude: 0 },
        {
          errors: ["Permission granted, requesting location"],
        }
      );
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      // Validate coordinates
      const validation = locationDebugger.validateCoordinates(
        coords.latitude,
        coords.longitude
      );

      locationDebugger.logLocationEvent("gps_location", coords, {
        accuracy: location.coords.accuracy,
        errors: validation.errors,
      });
      if (!validation.valid) {
        throw new Error(
          `Invalid coordinates received: ${validation.errors.join(", ")}`
        );
      }
      // Get reverse geocoded address for verification
      let address: string | undefined;
      try {
        const addresses = await Location.reverseGeocodeAsync(coords);
        if (addresses.length > 0) {
          const addr = addresses[0];
          address = [addr.city, addr.region, addr.country]
            .filter(Boolean)
            .join(", ");

          locationDebugger.logLocationEvent("reverse_geocode", coords, {
            address,
            errors: address ? [] : ["Failed to get readable address"],
          });
        }
        // cahged -- for types--
      } catch (reverseGeocodeError: unknown) {
        locationDebugger.logLocationEvent("reverse_geocode_error", coords, {
          errors: [
            `Reverse geocoding failed: ${getErrorMessage(reverseGeocodeError)}`,
          ],
        });
      }
      const locationData: WeatherLocation = {
        coordinates: coords,
        accuracy: location.coords.accuracy || undefined,
        address,
        timestamp: Date.now(),
        source: "gps",
      };
      this.currentLocation = locationData;
      return locationData;
      //   types---error
    } catch (error: unknown) {
      locationDebugger.logLocationEvent(
        "location_error",
        { latitude: 0, longitude: 0 },
        { errors: [`Location request failed: ${getErrorMessage(error)}`] }
      );
      // Try fallback methods
      return this.tryFallbackLocation(
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
  private async checkPermissionsWithDebug(): Promise<{
    granted: boolean;
    status: string;
  }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      locationDebugger.logLocationEvent(
        "permission_request",
        { latitude: 0, longitude: 0 },
        {
          errors: [`Permission status: ${status}`],
        }
      );
      return {
        granted: status === "granted",
        status,
      };
    } catch (error: unknown) {
      locationDebugger.logLocationEvent(
        "permission_error",
        { latitude: 0, longitude: 0 },
        { errors: [`Permission request failed: ${getErrorMessage(error)}`] }
      );
      return { granted: false, status: "error" };
    }
  }
  private async tryFallbackLocation(
    originalError: Error
  ): Promise<WeatherLocation> {
    locationDebugger.logLocationEvent(
      "fallback_attempt",
      { latitude: 0, longitude: 0 },
      {
        errors: [`Trying fallback due to: ${originalError.message}`],
      }
    );
    // Try cached location
    if (
      this.currentLocation &&
      Date.now() - this.currentLocation.timestamp < 300000
    ) {
      // 5 minutes
      locationDebugger.logLocationEvent(
        "cache_hit",
        this.currentLocation.coordinates,
        {
          address: this.currentLocation.address,
          errors: ["Using cached location"],
        }
      );
      return this.currentLocation;
    }
    // Try last known location
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 600000, // 10 minutes
        requiredAccuracy: 1000, // 1km
      });
      if (lastKnown) {
        const coords = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
        locationDebugger.logLocationEvent("last_known", coords, {
          accuracy: lastKnown.coords.accuracy,
          errors: ["Using last known location"],
        });
        return {
          coordinates: coords,
          accuracy: lastKnown.coords.accuracy || undefined,
          timestamp: Date.now(),
          source: "cache",
        };
      }
    } catch (lastKnownError: unknown) {
      locationDebugger.logLocationEvent(
        "last_known_error",
        { latitude: 0, longitude: 0 },
        {
          errors: [
            `Last known location failed: ${getErrorMessage(lastKnownError)}`,
          ],
        }
      );
    }
    // As a last resort, throw the original error
    throw originalError;
  }
  // Method to manually set location for testing
  setManualLocation(
    latitude: number,
    longitude: number,
    address?: string
  ): WeatherLocation {
    const coords = { latitude, longitude };
    const validation = locationDebugger.validateCoordinates(
      latitude,
      longitude
    );

    locationDebugger.logLocationEvent("manual_location", coords, {
      address,
      errors: validation.errors.concat(["Manually set location"]),
    });
    const locationData: WeatherLocation = {
      coordinates: coords,
      address,
      timestamp: Date.now(),
      source: "manual",
    };
    this.currentLocation = locationData;
    return locationData;
  }
  // Get debug report
  getLocationDebugReport(): string {
    return locationDebugger.getDebugReport();
  }
}
export default DebugLocationService.getInstance();
