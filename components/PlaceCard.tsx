import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Place } from "../services/nearbyPlacesService";

// defeine types ---
type Props = {
  place: Place;
  onPress: () => void;
  onTakePhoto: () => void;
};

export function PlaceCard({ place, onPress, onTakePhoto }: Props) {
  // rednr -- data---
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{place.name}</Text>
      <Text style={styles.sub}>{place.category}</Text>
      <Text style={styles.sub}>{place.address}</Text>
      {typeof place.distance === "number" && (
        <Text style={styles.sub}>{Math.round(place.distance)} m away</Text>
      )}
      <View style={{ height: 8 }} />
      <TouchableOpacity style={styles.btn} onPress={onTakePhoto}>
        <Text style={styles.btnText}>Take Photo</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
  },
  //   texts ---
  title: { fontWeight: "700" },
  sub: { color: "#555", marginTop: 2 },
  btn: {
    marginTop: 8,
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  btnText: { color: "white", fontWeight: "600" },
});
