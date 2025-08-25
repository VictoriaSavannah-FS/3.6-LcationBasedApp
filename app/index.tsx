import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        Connected Services App
      </Text>
      <Link href="/camera" asChild>
        <Button title="Camera / PhotoOps, anyone?📸" />
      </Link>
      <Link href="/qr" asChild>
        <Button title="QR Scanner + Decoder 🔍" />
      </Link>
      <Link href="/map" asChild>
        <Button title="Map 🗺️ |📍 Location" />
      </Link>
      <Link href="/profile" asChild>
        <Button title="Profile 😎 | ⚙️Settings" />
      </Link>
      {/* for enw Nearby FEature */}
      <Link href="/nearby" asChild>
        <Button title="Nearby Locations 😎 Feature" />
      </Link>
    </View>
  );
}
