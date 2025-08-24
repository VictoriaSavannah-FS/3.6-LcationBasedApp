# ConnectedServicesApp

Repo for a comprehensive mobile application using Expo that demonstrates the core concepts from Module 3.

## Platforms Testesd on ---

This app was tested on iOS (mobile) and Web (browser) and includes weather integration, map/location services, camera + QR scanning, Firebase authentication, and Firestore storage.

## FEATURES ---

Weather API (OpenWeatherMap):

- Display current weather w/ user’s location
- Forecast data
- Location Services (Expo Location + Mapbox):
- Get user’s current location with permission handling
- Show location on static maps
- Reverse geocoding for human-readable addresses
- Maps Integration: Static Mapbox map on both iOS + Web
- Error Handling: Graceful handling of denied permissions or API failures
- Auth: currently using Firebase Anonymosu User enabled

## Device Hardware Accesss

- Camera Integration (Expo Camera):
- Take photos and scan QR codes
- Works across mobile and web (browser fallback for QR scanning)
- QR Code Scanning:
- Decode URL, email, and phone QR codes types
- Open directly in browser, email, or phone
- Save scans to Firestore with timestamps for history view
- Photo Metadata: "EXIF" (basic) Retrieve location/timestamp data

## Custom Backend Services (Firebase)

- Authentication: Anonymous sign-in via Firebase Auth

```bash
// services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Quick anonymous sign-in
export async function signInAnon() {
  await signInAnonymously(auth);
}
```

- Firestore Database: Store user preferences and QR scan history

```bash
// services/qrLib.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

// Save each scan to Firestore under the signed-in user
export async function saveScan(decoded, raw: string) {
  const uid = auth.currentUser!.uid;
  await addDoc(collection(db, "users", uid, "scans"), {
    type: decoded.type,
    value: decoded.value,
    label: decoded.label,
    raw,
    createdAt: serverTimestamp(),
  });
}
```

- API Key Security: Keys stored in Firebase / local .env during dev

```bash

// app.json (Expo config) ---
"extra": {
  "weatherApiKey": "YOUR_OPENWEATHER_KEY",
  "mapboxToken": "YOUR_MAPBOX_TOKEN"
}

// services/weatherService.ts ---
const WEATHER_API_KEY = Constants.expoConfig?.extra?.weatherApiKey;
if (!WEATHER_API_KEY) throw new Error("Missing weather API key");

```

- Functions: Ready for expansion with Firebase Functions as backend proxies

```bash

// functions/index.js
const functions = require("firebase-functions");
const fetch = require("node-fetch");

// Example proxy for Weather API
exports.getWeather = functions.https.onRequest(async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.WEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const weather = await fetch(url).then(r => r.json());
  res.json(weather);
});
```

## SETUP PROJECT ----

### Clone Repo + Install

```bash

git clone https://github.com/VictoriaSavannah-FS/SavannahVictoria_ConnectedServicesApp.git

cd ConnectedServicesApp

npm install

```

### Configure API Keys ---

OpenWeatherMap

- Get a free API key: https://openweathermap.org/api
- Add it to your Expo app.json under extra.weatherApiKey

```bash
"extra": {
  "weatherApiKey": "YOUR_OPENWEATHER_KEY",
  "mapboxToken": "YOUR_MAPBOX_TOKEN"
}
```

Mapbox:

- Sign up:https://www.mapbox.com/
- Add your token under extra.mapboxToken in app.json ^^^

Firebase:

- Create a Firebase project: https://firebase.google.com/
- Don't forget to "Enable Anonymous Authentication" in Firebase Console
- Create a Firestore DB
- Copy your Firebase config into services/firebaseConfig.ts

### Firebase Setup

1. Create a Firebase project in the console.

- Build (from dropdown Menu) -Authentication - Sing-in Method - Choose Anonymous -> Enable User

2. Enable: Anonymous Authentication
   • Firestore Database
3. Copy your config snippet into firebaseConfig.ts.

## Testing Notes ---

Platforms Tested:

- ✅ iOS (Expo Go)
- ✅ Web (Chrome browser)

Known Issues:

- QR scanning on web depends on browser camera support (works best in Chrome).
- Styling uses React Native StyleSheet instead of NativeWind due to compatibility issues.
- Firebase Functions-> keys are handled via .env during development.

## Enhanced Feature: QR Code Library

For the Enhanced Feature I choose to try and implement a QR Code Scanner with History Tracking:

- Users can scan QR codes directly from the app.
- Each scan is stored in Firestore under the signed-in user.
- A “Scan History” list is displayed below the scanner, showing the last 10 scans.
- Something to be Aware: URLs open in browser, emails open in mail, phone numbers open in dialer.

### Resources

- [https://docs.expo.dev/guides/using-firebase/]
- [https://firebase.google.com/docs/web/]
- [https://firebase.google.com/support/dynamic-links-faq]
- [https://firebase.google.com/docs/projects/dev-workflows/general-best-practices]
- [https://firebase.google.com/docs/reference/js/app.firebaseserverapp]
- [https://openweathermap.org/current]
- [https://docs.expo.dev/versions/latest/sdk/camera/]
- [https://docs.expo.dev/versions/latest/sdk/location/]
- [https://docs.expo.dev/versions/latest/sdk/maps/]
- [https://labs.mapbox.com/developer-cheatsheet/]
- [https://docs.mapbox.com/api/maps/styles/]
- [https://docs.mapbox.com/api/maps/static-images/]
- [https://docs.mapbox.com/api/search/geocoding/]
- [https://docs.mapbox.com/api/search/geocoding/#geocoding-response-object]
- [https://github.com/expo/fyi/blob/main/firebase-js-auth-setup.md]
- [https://sasandasaumya.medium.com/building-a-qr-code-scanner-with-react-native-expo-df8e8f9e4c08]
- [https://sasandasaumya.medium.com/react-native-expo-maps-app-with-user-location-markers-and-google-maps-directions-ee020f6fd1ec]
