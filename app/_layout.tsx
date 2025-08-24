// import { Stack } from "expo-router";
// export default function RootLayout() {
//   return <Stack screenOptions={{ headerTitleAlign: "center" }} />;
// }
// //
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="map" options={{ title: "Map" }} />
      <Stack.Screen name="camera" options={{ title: "Camera" }} />
      <Stack.Screen name="qr" options={{ title: "QR" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
