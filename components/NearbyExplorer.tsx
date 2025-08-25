// components/NearbyExplorer.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";

// If you already built the hook:
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
// If you haven’t yet, temporarily comment the line above and uncomment this fallback:
// const useNearbyPlaces = () => ({
//   currentLocation: null,
//   locationLoading: false,
//   locationError: null,
//   places: [],
//   placesLoading: false,
//   placesError: null,
//   refreshLocation: async () => {},
//   searchPlaces: () => {},
//   getPlaceDetails: async () => null,
// });

export default function NearbyExplorer() {
  const { places, placesLoading, placesError, locationError } =
    useNearbyPlaces();

  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Location error: {locationError}</Text>
      </View>
    );
  }

  if (placesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.msg}>Finding nearby places…</Text>
      </View>
    );
  }

  if (placesError) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Error: {placesError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {places.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.msg}>No places yet. Try searching.</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.sub}>{item.address}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  msg: { color: "#333", marginTop: 8 },
  item: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  title: { fontWeight: "600" },
  sub: { color: "#666", marginTop: 2 },
});
