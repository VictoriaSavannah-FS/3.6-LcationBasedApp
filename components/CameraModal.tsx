import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Place } from "../services/nearbyPlacesService";

type Props = {
  visible: boolean;
  onClose: () => void;
  place: Place | null;
};

export function CameraModal({ visible, onClose, place }: Props) {
  // Stub: replace with real camera later
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Text style={styles.title}>Camera (stub)</Text>
          <Text style={{ color: "#666", marginTop: 6 }}>
            {place?.name ?? ""}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    width: "85%",
  },
  //   texts
  title: { fontSize: 18, fontWeight: "700" },
  //   btns---
  btn: {
    marginTop: 12,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "600" },
});
