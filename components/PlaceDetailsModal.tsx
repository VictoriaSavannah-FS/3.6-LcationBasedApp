import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Place } from "../services/nearbyPlacesService";

type Props = {
  visible: boolean;
  place: Place | null;
  onClose: () => void;
  onTakePhoto: () => void;
};

export function PlaceDetailsModal({
  visible,
  place,
  onClose,
  onTakePhoto,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{place?.name ?? "Place"}</Text>
          <Text style={styles.sub}>{place?.address ?? ""}</Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.btn} onPress={onTakePhoto}>
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>
          {/* buttin/ trigeer */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#ccc" }]}
            onPress={onClose}
          >
            <Text style={[styles.btnText, { color: "#222" }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
// --- styles ---
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: 18, fontWeight: "700" },
  sub: { color: "#666", marginTop: 4 },
  btn: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "600" },
});
