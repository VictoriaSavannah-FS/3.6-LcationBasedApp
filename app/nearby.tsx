import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";

import NearbyExplorer from "../components/NearbyExplorer"; // no braces!

export default function NearbyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <NearbyExplorer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1 },
});
