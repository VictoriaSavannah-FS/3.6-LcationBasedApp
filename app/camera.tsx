import React, { useRef, useState, useEffect } from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
// imrpot camServices
import cameraService from "../services/cameraService";
// import mapURi @loc data
import { staticMapUrl } from "../services/mapboxService";
// iport @location for Coords?
import { Coords } from "../services/location";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null); // use cameraRef from services ----
  // fetch latest img metadet/existing---
  const [lastUri, setLastUri] = useState<string | null>(null);

  // NEW ++ -->> fetch EXIF --> pass to rendr ---
  const [exif, setExif] = useState<any | null>(null);
  const [takenAt, setTakenAt] = useState<string | null>(null);
  const [gps, setGps] = useState<Coords | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  // useRefe into servixe@mount x1
  useEffect(() => {
    cameraService.setCameraRef(cameraRef);
  }, []);

  if (!permission) {
    // Camera permissions are still loading...
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are X not granted yet...
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera...
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  // ----- Toogle Cam
  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  /** EXIF parsers ------
   * only asking ofr timeStamp and locations
   */
  function extractTakenAt(meta: any): string | null {
    // if No data -null.empty
    if (!meta) return null;
    return (
      meta.DateTimeOriginal ||
      meta.CreateDate ||
      meta.DateTime ||
      meta["{TIFF}"]?.DateTime ||
      null
    );
  }
  // GETy Location -------
  function extractGps(meta: any): Coords | null {
    if (!meta) return null;

    // 1) Already-decimal fields (many devices)
    const decLat = meta.GPSLatitudeDecimal ?? meta.latitude;
    const decLon = meta.GPSLongitudeDecimal ?? meta.longitude;
    if (typeof decLat === "number" && typeof decLon === "number") {
      return { latitude: decLat, longitude: decLon };
    }

    // 2) Nested {GPS} block sometimes provided by Expo
    const gps = meta["{GPS}"];
    if (
      gps &&
      typeof gps.Latitude === "number" &&
      typeof gps.Longitude === "number"
    ) {
      return { latitude: gps.Latitude, longitude: gps.Longitude };
    }

    // 3) Fallback: plain numbers in GPSLatitude/GPSLongitude
    if (
      typeof meta.GPSLatitude === "number" &&
      typeof meta.GPSLongitude === "number"
    ) {
      return { latitude: meta.GPSLatitude, longitude: meta.GPSLongitude };
    }
    return null;
  }

  // ----- take Picture ---
  const takePicture = async () => {
    // triger /btn + response
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // cameSrevce fetch
      const photo = await cameraService.takePhoto({
        quality: 0.9,
        exif: true,
      });
      setLastUri(photo.uri); //update state
      setExif(photo.exif ?? null);
      // Pass new exif data
      const time = extractTakenAt(photo.exif);
      const gps = extractGps(photo.exif);
      // update Sates
      setTakenAt(time);
      setGps(gps);
      setMapUrl(
        gps
          ? staticMapUrl({
              latitude: gps.latitude,
              longitude: gps.longitude,
              zoom: 14,
              width: 600,
              height: 360,
              // style: "dark-v11", // optional
            }) ?? null
          : null
      );

      // save to lilrabry - iOS
      if (Platform.OS === "web") {
        Alert.alert("Captured", "Photo captured - but not saved on web.");
      } else {
        await cameraService.saveToMediaLibrary(photo.uri);
        Alert.alert("Saved", "Yay! Your photo was saved to your library!");
      }

      // // Web fallback --
      // async function saveWebFallback(uri: string, filename = `photo-${Date.now()}.jpg`) {
      //   // Browser-only download
      //   const res = await fetch(uri);
      //   const blob = await res.blob();
      //   const url = URL.createObjectURL(blob);
      //   const a = document.createElement("a");
      //   a.href = url;
      //   a.download = filename;
      //   document.body.appendChild(a);
      //   a.click();
      //   a.remove();
      //   URL.revokeObjectURL(url);
      // }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message ?? "FAiled to take and save photo..."
      );
    }
  };

  // -- chooes from lib..
  const pickFromLib = async () => {
    try {
      // call camService -- pickIamgefromLib + parms
      const asset = await cameraService.pickImageFromLibrary({
        allowsEditing: true,
        quality: 0.9,
        includeBase64: false,
      });
      if (!asset) return; // err hndler
      setLastUri(asset.uri); // remember which photo was picked
      setExif(asset.exif ?? null); // save the whole EXIF metadata block if available

      // PAss Xif props data --from photMEtada

      const time = extractTakenAt(asset.exif);
      const gps = extractGps(asset.exif);
      // updte St8ts /w// new data
      setTakenAt(time);
      setGps(gps);
      // REdner a MapBOx Map based @ GPS data ---
      setMapUrl(
        // logis -> if props/ pass
        gps
          ? staticMapUrl({
              latitude: gps.latitude,
              longitude: gps.longitude,
              zoom: 14,
              width: 600,
              height: 360,
            }) ?? null
          : null
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "failed to pick image...");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef} // << wire the ref so CameraService can call takePictureAsync
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>

          {/* Take Picture---  */}
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Take Picture</Text>
          </TouchableOpacity>

          {/* Choose Photo  --- */}
          <TouchableOpacity style={styles.button} onPress={pickFromLib}>
            <Text style={styles.text}>Choose Picture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Phot URI / metada dispay --- */}
      {lastUri ? (
        <View style={{ alignItems: "center", padding: 12, gap: 8 }}>
          {/* render photo thumbnail */}
          <Image
            source={{ uri: lastUri }}
            style={{ width: 120, height: 120, borderRadius: 10 }}
          />

          {/* file URI path */}
          <Text numberOfLines={1} style={styles.uri}>
            {lastUri}
          </Text>

          {/* show extracted EXIF metadata */}
          <View style={{ marginTop: 8, alignItems: "center" }}>
            <Text style={{ fontWeight: "700" }}>Photo Metadata</Text>

            {/* show timestamp if present */}
            <Text style={{ color: "#333" }}>Taken: {takenAt ?? "—"}</Text>

            {/* show GPS coords (rounded) if present */}
            <Text style={{ color: "#333" }}>
              GPS:{" "}
              {gps
                ? `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`
                : "—"}
            </Text>
          </View>

          {/* Mapbox static map preview (only if GPS exists) */}
          {mapUrl ? (
            <Image
              source={{ uri: mapUrl }}
              style={{ width: 280, height: 160, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ color: "#666" }}>No location metadata found.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    backgroundColor: "red",
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  uri: {
    marginTop: 6,
    fontSize: 12,
    color: "#555",
    width: "90%",
  },
});
