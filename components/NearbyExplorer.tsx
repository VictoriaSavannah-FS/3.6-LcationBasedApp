// // components/NearbyExplorer.tsx
// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   FlatList,
// } from "react-native";

// import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
// // If you haven’t yet, temporarily comment the line above and uncomment this fallback:
// // const useNearbyPlaces = () => ({
// //   currentLocation: null,
// //   locationLoading: false,
// //   locationError: null,
// //   places: [],
// //   placesLoading: false,
// //   placesError: null,
// //   refreshLocation: async () => {},
// //   searchPlaces: () => {},
// //   getPlaceDetails: async () => null,
// // });

// export default function NearbyExplorer() {
//   const { places, placesLoading, placesError, locationError } =
//     useNearbyPlaces();

//   if (locationError) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.msg}>Location error: {locationError}</Text>
//       </View>
//     );
//   }

//   if (placesLoading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator />
//         <Text style={styles.msg}>Finding nearby places…</Text>
//       </View>
//     );
//   }

//   if (placesError) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.msg}>Error: {placesError}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {places.length === 0 ? (
//         <View style={styles.center}>
//           <Text style={styles.msg}>No places yet. Try searching.</Text>
//         </View>
//       ) : (
//         <FlatList
//           // pass data---
//           data={places}
//           keyExtractor={(p) => p.id}
//           renderItem={({ item }) => (
//             <View style={styles.item}>
//               <Text style={styles.title}>{item.name}</Text>
//               <Text style={styles.sub}>{item.address}</Text>
//             </View>
//           )}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 16,
//   },
//   msg: { color: "#333", marginTop: 8 },
//   item: {
//     padding: 12,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderColor: "#eee",
//   },
//   title: { fontWeight: "600" },
//   sub: { color: "#666", marginTop: 2 },
// });

// components/NearbyExplorer.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";

// Hook we wrote earlier that handles: location, fetching places, errors, etc.
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";

// ❗ If you're still wiring things up and the hook crashes,
// you can temporarily comment it out and use this fake fallback instead.
// That way the component will still render without blowing up.
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
  // Destructure the values we care about from the hook.
  // - places → array of results
  // - placesLoading → boolean loading state
  // - placesError → error string if request failed
  // - locationError → error string if location couldn’t be determined
  const { places, placesLoading, placesError, locationError } =
    useNearbyPlaces();

  // --- ERROR BRANCH: location didn’t work (permissions, GPS off, etc.)
  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Location error: {locationError}</Text>
      </View>
    );
  }

  // --- LOADING BRANCH: waiting for nearby places to come back
  if (placesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.msg}>Finding nearby places…</Text>
      </View>
    );
  }

  // --- ERROR BRANCH: API call itself failed (Mapbox, network, etc.)
  if (placesError) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Error: {placesError}</Text>
      </View>
    );
  }

  // --- MAIN RENDER: got either an empty array or real places
  return (
    <View style={styles.container}>
      {places.length === 0 ? (
        // Nothing in the array yet
        <View style={styles.center}>
          <Text style={styles.msg}>No places yet. Try searching.</Text>
        </View>
      ) : (
        // lsit w/rednred data
        <FlatList
          // pass data directly
          data={places}
          // new row w/e/a key
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {/* Place name */}
              <Text style={styles.title}>{item.name}</Text>
              {/* Address shown smaller / greyed */}
              <Text style={styles.sub}>{item.address}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// --- Thee Stylings ---
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
    borderBottomWidth: StyleSheet.hairlineWidth, // thin line under each item
    borderColor: "#eee",
  },

  title: { fontWeight: "600" }, // bold name

  sub: { color: "#666", marginTop: 2 }, // greyed-out address
});
