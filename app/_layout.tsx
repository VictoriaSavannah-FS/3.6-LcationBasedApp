import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="map" options={{ title: "Map" }} />
        <Stack.Screen name="camera" options={{ title: "Camera" }} />
        <Stack.Screen name="qr" options={{ title: "QR" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="nearby" options={{ title: "Nearby" }} />
      </Stack>
    </QueryClientProvider>
  );
}
