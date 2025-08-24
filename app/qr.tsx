// import auth==userID
import { authListen } from "../services/firebaseConfig";
// app/qr.tsx
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
// pull in my qr helper fns (decode raw string -> friendly info)
import { decodeQR, DecodedQR } from "../services/qrService";

// SAVE QR Scans! -- yeah!
import { saveScan, listScans, type StoredScan } from "../services/qrLib";

export default function QRScreen() {
  // --- ST8t & refs ---
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<{
    type: string;
    data: string;
  } | null>(null);
  const [decoded, setDecoded] = useState<DecodedQR | null>(null);
  const [scanning, setScanning] = useState(true);

  // QR store States--------
  const [history, setHistory] = useState<StoredScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ref to actual camera component
  const cameraRef = useRef<CameraView>(null);
  // ---------- added--> Auth for userId

  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    //singIn first to get userID---
    return authListen(setUid);
  }, []);

  // --- useEffect --- lol!
  useEffect(() => {
    // if no perms yet... ask user
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  // whnn uid --> signed in --> render Lib---
  useEffect(() => {
    if (!uid) return; // need a user id
    (async () => {
      setLoadingHistory(true);
      try {
        // new signature: listScans({ limit })
        const items = await listScans({ limit: 10 });
        setHistory(items);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [uid]);

  // edge case: if hook not ready yet
  if (!permission) return <View />;

  // if user denied perms -> show msg
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>
          Hey there... We still need camera permission to scan QR codes.
        </Text>
      </View>
    );
  }

  // --- handler: open decoded results in right app (web/email/phone) ---
  const handleOpenAction = (item: DecodedQR) => {
    try {
      if (item.type === "url") {
        // open in browser (make sure http added if missing)
        Linking.openURL(
          item.value.startsWith("http") ? item.value : `https://${item.value}`
        );
      } else if (item.type === "email") {
        Linking.openURL(`mailto:${item.value}`);
      } else if (item.type === "phone") {
        Linking.openURL(`tel:${item.value}`);
      }
    } catch (e) {
      Alert.alert("Oops", "Couldn't open that.");
    }
  };

  // --- handler: when camera sees a QR code ---
  const onBarcodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (!scanning) return; // skip if paused
    setScanning(false); // stop scanning @/fter 1 result
    setLastScan({ type, data }); // store raw

    // pass (data) => set cosnt to hodl decoded QR data ---
    const deCode = decodeQR(data);
    setDecoded(deCode);

    //SAVE to firesTone db!! IF USER -----
    if (uid) {
      try {
        //=saveScan(decoded, raw) — no uid arg
        await saveScan({
          type: deCode.type,
          value: deCode.value,
          label: deCode.label,
          raw: data,
        });
        // refrsh list w/new lsit--
        const items = await listScans({ limit: 10 });
        setHistory(items);
      } catch (e) {
        Alert.alert(
          "SAve Failde",
          "I'm sorry but couldn't save scan to QR Library..."
        );
      }
    }

    // decode raw -> friendly info (url/email/etc)
    // setDecoded(decodeQR(data));
  };

  return (
    <View style={styles.container}>
      {/* actual camera view that does scanning */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        // restrict to QR only (not all barcodes)
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        // scanning only runs if scanning==true
        onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
      />

      {/* --- Result @ under camera --- */}
      <View style={styles.result}>
        <Text style={styles.title}>Decoded Result</Text>

        {/* if we decoded smth -> show it, else show dash */}
        {decoded ? (
          <View>
            <Text style={styles.text}>Type: {decoded.type.toUpperCase()}</Text>
            <Text style={styles.text}>
              {decoded.label}: {decoded.value || "—"}
            </Text>

            {/* action btn (open in browser, dial phone, etc) */}
            {(decoded.type === "url" ||
              decoded.type === "email" ||
              decoded.type === "phone") && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleOpenAction(decoded)}
              >
                <Text style={styles.actionBtnText}>
                  {decoded.type === "url"
                    ? "Open Website"
                    : decoded.type === "email"
                    ? "Send Email"
                    : "Call Number"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.text}>—</Text>
        )}
        {/* --- History list --- */}
        <View style={styles.historyBox}>
          <Text style={styles.title}>Scan History</Text>
          {!uid && <Text style={styles.text}>Sign in to save history.</Text>}
          {uid &&
            (loadingHistory ? (
              <Text style={styles.text}>Loading…</Text>
            ) : history.length === 0 ? (
              <Text style={styles.text}>No scans yet.</Text>
            ) : (
              history.map((h) => (
                <View key={h.id} style={styles.historyItem}>
                  <Text style={styles.text}>
                    {h.label}: {h.value || "—"}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(h.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            ))}
        </View>
        {/* raw scan value (for debug) */}
        <Text style={[styles.title, { marginTop: 12 }]}>Raw Scan</Text>
        <Text style={styles.text}>
          {lastScan ? `${lastScan.type}: ${lastScan.data}` : "—"}
        </Text>

        {/* btn to stop/resume scanning */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FF3B30" }]}
          onPress={() => setScanning((cur) => !cur)}
        >
          <Text style={styles.actionBtnText}>
            {scanning ? "Stop Scanning" : "Resume Scanning"}
          </Text>
        </TouchableOpacity>

        {/* lil note on web fallback */}
        {Platform.OS === "web" && (
          <Text style={styles.note}>
            Note: QR scanning on web depends on browser camera support.
          </Text>
        )}
      </View>
    </View>
  );
}

// --- styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  result: { padding: 16, backgroundColor: "#fff" },
  // text---
  title: { fontWeight: "700", marginBottom: 4 },
  text: { color: "#333" },
  note: { marginTop: 6, fontSize: 12, color: "#666" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  msg: { padding: 16, textAlign: "center" },
  // btsn ----
  actionBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  actionBtnText: { color: "white", fontWeight: "600" },
  // styles for QR Linbray-----
  historyBox: {
    marginTop: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
});
