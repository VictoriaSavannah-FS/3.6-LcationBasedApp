// This file handles all the logic for QR Code decoding.
// It takes the raw string from a QR scan and converts it
// into something human-friendly (like Website, Email, Phone, etc).

// ----------------------
// Define ==> decoded QR result types
// E/a "type" has =>easy to read name + value -> the actual data taht wlll be returned
// ----------------------
export type DecodedQR =
  | { type: "url"; label: "Website"; value: string }
  | { type: "email"; label: "Email"; value: string }
  | { type: "phone"; label: "Phone"; value: string }
  | { type: "wifi"; label: "WiFi SSID"; value: string }
  | { type: "text"; label: "Text" | "Empty"; value: string };

// ----------------------
// Main function: decodeQR
// Input: a string from the QR scanner
// Output: a structured object (DecodedQR) with type, label, and value
// ----------------------
export function decodeQR(data: string): DecodedQR {
  // Case 1: If no data at all (empty QR code)
  if (!data) return { type: "text", label: "Empty", value: "" };

  // Case 2: Website links
  if (data.startsWith("http://") || data.startsWith("https://")) {
    try {
      // Try to parse it as a real URL so we can get the hostname (domain only)
      const url = new URL(data);
      return { type: "url", label: "Website", value: url.hostname };
    } catch {
      // If parsing fails, just return the full raw link
      return { type: "url", label: "Website", value: data };
    }
  }

  // Case 3: Email address => checks =>  has @ and a dot)
  if (data.includes("@") && data.includes(".")) {
    return { type: "email", label: "Email", value: data };
  }

  // Case 4: Phone numbers (basic check: optional +, then at least 7 digits)
  if (/^\+?\d{7,}$/.test(data)) {
    return { type: "phone", label: "Phone", value: data };
  }

  // Case 5: WiFi info (common QR format: WIFI:S:SSID;T:WPA;P:password;;)
  if (data.startsWith("WIFI:")) {
    // Pull out the SSID (network name) using a regex
    const ssidMatch = data.match(/S:([^;]*)/);
    return {
      type: "wifi",
      label: "WiFi SSID",
      value: ssidMatch ? ssidMatch[1] : "Unknown",
    };
  }

  // Case 6: Fallback (if nothing else matched, just plain text)
  return { type: "text", label: "Text", value: data };
}

// åResource: Helpful blog post on building QR scanners with Expo
// https://sasandasaumya.medium.com/building-a-qr-code-scanner-with-react-native-expo-df8e8f9e4c08
