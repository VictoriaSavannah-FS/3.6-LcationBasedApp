import axios, { AxiosError } from "axios";
import locationDebugger from "../utils/debugLocation";
import { WeatherLocation } from "./debugLocationService";

// Minimal shape we actually read from OpenWeather
interface OWMWeatherItem {
  description?: string;
}
interface OWMResponse {
  coord?: { lat?: number; lon?: number };
  name?: string;
  weather?: OWMWeatherItem[];
  // ...you can extend as needed
}

interface WeatherDebugInfo {
  requestUrl: string;
  requestParams: {
    lat: number;
    lon: number;
    appid: string;
    units: "metric" | "imperial";
  };
  responseData?: OWMResponse;
  error?: string;
  coordinatesMismatch?: boolean;
}

// ---- helpers ----
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
function getAxiosParts(e: unknown): { isAxios: boolean; err?: AxiosError } {
  if (axios.isAxiosError(e)) return { isAxios: true, err: e };
  return { isAxios: false };
}

class DebugWeatherService {
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWeatherWithDebug(location: WeatherLocation): Promise<
    OWMResponse & {
      debug: WeatherDebugInfo & {
        coordinateDistance: number;
        requestedCoordinates: WeatherLocation["coordinates"];
        responseCoordinates: { latitude: number; longitude: number } | null;
      };
    }
  > {
    const { latitude, longitude } = location.coordinates;

    // metric - no
    const requestParams: WeatherDebugInfo["requestParams"] = {
      lat: latitude,
      lon: longitude,
      appid: this.apiKey,
      units: "metric",
    };

    locationDebugger.logLocationEvent("weather_request", location.coordinates, {
      address: location.address,
      errors: [`Requesting weather for: ${latitude}, ${longitude}`],
    });

    const debugInfo: WeatherDebugInfo = {
      requestUrl: `${this.baseUrl}/weather`,
      requestParams,
    };

    try {
      const response = await axios.get<OWMResponse>(debugInfo.requestUrl, {
        params: debugInfo.requestParams,
        timeout: 10_000,
      });

      const data = response.data || {};
      debugInfo.responseData = data;

      // Guard missing coord from API
      const respLat = data.coord?.lat;
      const respLon = data.coord?.lon;
      let responseCoords: { latitude: number; longitude: number } | null = null;

      let coordinateDistance = Number.NaN;
      if (typeof respLat === "number" && typeof respLon === "number") {
        responseCoords = { latitude: respLat, longitude: respLon };
        coordinateDistance = this.calculateDistance(
          location.coordinates,
          responseCoords
        );
      }

      // Flag if weather data coordinates are significantly different (>10 km)
      const mismatch =
        typeof coordinateDistance === "number" &&
        !Number.isNaN(coordinateDistance) &&
        coordinateDistance > 10_000;
      debugInfo.coordinatesMismatch = mismatch;

      // Safe description pull
      const desc =
        data.weather && data.weather.length
          ? data.weather[0]?.description
          : undefined;

      locationDebugger.logLocationEvent(
        "weather_response",
        responseCoords ?? { latitude: 0, longitude: 0 },
        {
          address: data.name,
          weatherData: {
            location: { name: data.name ?? "Unknown" },
            current: { description: desc ?? "No description" },
          },
          errors: mismatch
            ? [
                `WARNING: Coordinate mismatch! Requested: ${latitude}, ${longitude} Got: ${
                  responseCoords?.latitude
                }, ${responseCoords?.longitude} (${Math.round(
                  (coordinateDistance as number) / 1000
                )}km difference)`,
              ]
            : [],
        }
      );

      return {
        ...data,
        debug: {
          ...debugInfo,
          coordinateDistance: Number.isNaN(coordinateDistance)
            ? -1
            : Math.round(coordinateDistance as number),
          requestedCoordinates: location.coordinates,
          responseCoordinates: responseCoords,
        },
      };
    } catch (error: unknown) {
      const { isAxios, err } = getAxiosParts(error);
      const msg = getErrorMessage(error);
      debugInfo.error = msg;

      locationDebugger.logLocationEvent("weather_error", location.coordinates, {
        errors: [`Weather request failed: ${msg}`],
      });

      // Extra console context for axios errors ---n
      if (isAxios && err) {
        if (err.response) {
          console.error("Weather API Error Response:", {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers,
          });
        } else if (err.request) {
          console.error("Weather API No Response:", err.request);
        } else {
          console.error("Weather API Request Setup Error:", err.message);
        }
      }

      throw isAxios && err ? err : new Error(msg);
    }
  }

  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6_371_000; // meters
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default DebugWeatherService;
