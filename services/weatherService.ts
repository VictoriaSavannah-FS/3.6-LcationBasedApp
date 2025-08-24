// import createApiClient from "./apiClient";//not anymore ---
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

//deinfe the baseURL -> where fetching the data
const WEATHER_API_KEY = Constants.expoConfig?.extra?.weatherApiKey;

//target API ednpoint@openWeather
// const WEATHER_BASE_URL = "https://api.openweathermap.org/data/3.0/onecall";
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const CACHE_TIME = 10 * 60 * 1000; // remmeebr Weathrdata for 10 mins =-=> then Refresh

// DEfien Types---- --
export type CurrentWeather = {
  name: string;
  sys: { country: string };
  weather: { description: string; icon: string }[];
  main: { temp: number; feels_like: number };
};
// FUruture WEATEHR -------
export type ForecastItem = {
  dt: number;
  main: { temp: number };
  weather: { description: string; icon: string }[];
};
// Icon@OpenWeather
export const iconUrl = (icon: string) =>
  `https://openweathermap.org/img/wn/${icon}@2x.png`;

// ---- Logic/fucntion helpers ----
// GET cachd WeatehrDAta---
async function getCache<T>(key: string): Promise<T | null> {
  try {
    // fetch frim storage
    const raw = await AsyncStorage.getItem(key);
    // lgic-> IF X null
    if (!raw) return null;
    // parse data --> JSON formt
    //ts:timeStmap/dataValues---
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TIME) {
      // IF timeEXPIRED = remove -- -> retnr null -fresh
      await AsyncStorage.removeItem(key);
      return null;
    }
    // ELSE--> reuturn data
    return data as T; //T=any type of data feethed
  } catch {
    return null;
  }
}
// PAss cahed dAta =T
async function setCache<T>(key: string, data: T) {
  try {
    // svae JSON w/ data Tyoe {types}
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // graceful fial - won't crash up -- silently failing....shh...shh...
  }
}

// API KEY - CHECKS ------
function requireKey() {
  if (!WEATHER_API_KEY) {
    // IF NO KWY/MIA -----thrrw error----
    throw new Error(
      "Missing OpenWeather API key. Add it to app.json -> expo.extra.weatherApiKey"
    );
  }
}

// ---- Public API from API to ge WEather ----
export async function getCurrentWeather(
  lat: number,
  lon: number,
  opts: { units?: "imperial" | "metric" } = {}
): Promise<CurrentWeather> {
  // chekc Key
  requireKey();
  // alwsya ->fallback: deflt ->  imperial for 56˚F's
  const units = opts.units ?? "imperial";
  const cacheKey = `@weather_current_${lat}_${lon}_${units}`;

  // Chek cahed DAta 1st-----
  const cached = await getCache<CurrentWeather>(cacheKey);
  // return IF data exist ===
  if (cached) return cached;
  // IF NOT--> fech form API @----
  const url = `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=${units}`;
  // wait/res---
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API failed (${res.status})`);
  const json = (await res.json()) as CurrentWeather;
  // Save/store new fetched data---
  await setCache(cacheKey, json);
  return json;
}

// ---- Public API from API to get FOREcaST ----

export async function getForecast(
  // types
  lat: number,
  lon: number,
  opts: { units?: "imperial" | "metric"; take?: number } = {}
): Promise<ForecastItem[]> {
  // check key ---
  requireKey();
  const units = opts.units ?? "imperial";
  const take = opts.take ?? 4; // next 12h (3h intervals)
  const cacheKey = `@weather_forecast_${lat}_${lon}_${units}_${take}`;
  // / Chek cahed DAta 1st-----
  const cached = await getCache<ForecastItem[]>(cacheKey);
  // return IF data exist ===
  if (cached) return cached;
  // IF NOT--> fech form API @----
  const url = `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=${units}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast API failed (${res.status})`);
  const json = await res.json();
  const list: ForecastItem[] = json.list?.slice(0, take) ?? [];
  // Save/store new fetched data---
  await setCache(cacheKey, list);
  return list;
}
// ------ CLEAR / FRSH ST@RT ---
export async function clearWeatherCache() {
  // get all keys @Async storage
  const keys = await AsyncStorage.getAllKeys();
  // filtres for KEys w/ Weather fetches
  const toRemove = keys.filter((k) => k.startsWith("@weather_"));
  // cool! delete @All at once ----
  await AsyncStorage.multiRemove(toRemove);
}
