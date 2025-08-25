import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import debugLocationService from "../services/debugLocationService";
import DebugWeatherService from "../services/debugWeatherService";
import locationDebugger from "../utils/debugLocation";

interface LocationDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  weatherApiKey: string;
}

// --- helpers --> return a error messages---
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
function isValidLatLon(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export const LocationDebugPanel: React.FC<LocationDebugPanelProps> = ({
  visible,
  onClose,
  weatherApiKey,
}) => {
  const [debugReport, setDebugReport] = useState<string>("");
  const [testLatitude, setTestLatitude] = useState<string>("");
  const [testLongitude, setTestLongitude] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // memoize service instance to avoid re-creating on each render
  const weatherService = useMemo(
    () => new DebugWeatherService(weatherApiKey),
    [weatherApiKey]
  );

  useEffect(() => {
    if (visible) {
      updateDebugReport();
    }
  }, [visible]);

  const updateDebugReport = useCallback(() => {
    const report = debugLocationService.getLocationDebugReport();
    setDebugReport(report);
  }, []);

  const testCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const location = await debugLocationService.getCurrentLocationWithDebug();
      await weatherService.getWeatherWithDebug(location);
      updateDebugReport();
      Alert.alert(
        "Success",
        "Location and weather data retrieved successfully"
      );
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [updateDebugReport, weatherService]);

  const testManualLocation = useCallback(async () => {
    const lat = parseFloat(testLatitude);
    const lon = parseFloat(testLongitude);
    if (!isValidLatLon(lat, lon)) {
      Alert.alert(
        "Error",
        "Please enter valid coordinates:\nlat ∈ [-90, 90], lon ∈ [-180, 180]"
      );
      return;
    }
    setLoading(true);
    try {
      const location = debugLocationService.setManualLocation(
        lat,
        lon,
        "Test Location"
      );
      await weatherService.getWeatherWithDebug(location);
      updateDebugReport();
      Alert.alert("Success", "Manual location test completed");
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [testLatitude, testLongitude, updateDebugReport, weatherService]);

  const clearDebugLog = useCallback(() => {
    locationDebugger.clearLog();
    setDebugReport("");
    Alert.alert("Success", "Debug log cleared");
  }, []);

  const exportDebugLog = useCallback(() => {
    const logData = locationDebugger.exportLog();
    console.log("Debug Log Export:", logData);
    Alert.alert("Exported", "Debug log exported to console");
  }, []);

  const testKnownGoodLocations = useCallback(async () => {
    const testLocations: ReadonlyArray<{
      lat: number;
      lon: number;
      name: string;
    }> = [
      { lat: 40.7128, lon: -74.006, name: "New York City" },
      { lat: 34.0522, lon: -118.2437, name: "Los Angeles" },
      { lat: 51.5074, lon: -0.1278, name: "London" },
    ];
    setLoading(true);

    for (const testLoc of testLocations) {
      try {
        const location = debugLocationService.setManualLocation(
          testLoc.lat,
          testLoc.lon,
          testLoc.name
        );
        await weatherService.getWeatherWithDebug(location);
      } catch (error: unknown) {
        console.error(
          `Test failed for ${testLoc.name}:`,
          getErrorMessage(error)
        );
      }
    }

    updateDebugReport();
    setLoading(false);
    Alert.alert("Complete", "Known location tests completed");
  }, [updateDebugReport, weatherService]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <View style={styles.container}>
        <View
          // className="header"
          style={styles.header}
        >
          <Text style={styles.title}>Location Debug Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content}>
          {/* Test Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Controls</Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={testCurrentLocation}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Test Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={testKnownGoodLocations}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Test Known Good Locations</Text>
            </TouchableOpacity>
            <View style={styles.manualTestSection}>
              <Text style={styles.label}>Manual Location Test:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Latitude"
                  value={testLatitude}
                  onChangeText={setTestLatitude}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Longitude"
                  value={testLongitude}
                  onChangeText={setTestLongitude}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={testManualLocation}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Test Manual Location</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Debug Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Controls</Text>

            <TouchableOpacity style={styles.button} onPress={updateDebugReport}>
              <Text style={styles.buttonText}>Refresh Debug Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={clearDebugLog}>
              <Text style={styles.buttonText}>Clear Debug Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={exportDebugLog}>
              <Text style={styles.buttonText}>Export Debug Log</Text>
            </TouchableOpacity>
          </View>
          {/* Debug Report */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Report</Text>
            <ScrollView style={styles.reportContainer}>
              <Text style={styles.reportText}>
                {debugReport || "No debug data available"}
              </Text>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  manualTestSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  reportContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    maxHeight: 300,
  },
  reportText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 16,
  },
});
