# REFLECTION

### What was most challenging about third-party API integration?

- For me it was how time consuming some of them were to setup initially and ensuring that I was instaling the correct dev dependencies that would work with them. Apart from that, reading through all the third-part API official docs to ensure I even knew what data types to call from the API. I found myself fallign down rabbit holes time and time again lookign through the documents because of cool feautures I'd see and start reading about. It's almost intimidating and overwhelming how much information there is out there for each API (which is a great thing to have). But the fact that I'd have to dig through docs to try and find the "one" thing I really needed was a little tiring and annoying sometimes on a time-crunch. Laslty, knowing which types, and deep objects within the JSON docs to target to fetch the necessary information needed - as well a being aware of the version of the API calls. Oh! And ensuring that any declared values like {latitude and longitued} remained consistent throught the various files, components and functions to parse and fetch an API call correctly like passing the correct values to this API call.

```bash
const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=$
```

Laslty! The one gotcha was that I actually had to activte and enable the Anonymous User Profile Permission on the Firebase console first before actaully trying to test it and use it my project. Which is why it kept failing each time I was trying to Sign into the Profile screen:

```bash
# Error Mesage ----
Firebase: Error (auth/configuration-not-found).
```

### How did you handle API key security and Firebase Functions?

I tried to avoid directly hardcoding sensitive API keys into the front end. Instead, I used Firebase Functions as a simple backend proxy. That way my Expo client/frontend can make calls to the defined Firebase endpoints, and Firebase makes the actual requests with the API keys stored securely in environment variables.

For testing and development, I kept a .env file locally with my keys, but for production I relied on Firebase’s built-in config system to manage them.

```bash
const firebaseConfig = {
  apiKey: "apiKEy went go here...",
  authDomain: "connected-services-app.firebaseapp.com",
  projectId: "connected-services-app",
  storageBucket: "connected-services-app.firebasestorage.app",
  messagingSenderId: "params-would-go-here",
  appId: "app-id-#########",}

```

Once I was able to make some adjusments and installed some necessary dev deps for the server, I was able to setup it correclty.

### What would you improve with more time?

As always, the last thing on my mind was styling. I focused heavily on functionality, making sure my functions, components, and logic all worked correctly. If I had more time, the three main things I would improve are:

1.  Visual styling and theme — right now it’s clean but basic. I’d want to improve the overall layout, spacing, and color scheme for better user experience.
2.  Data presentation — for example, making the weather forecast more visually appealing instead of just text, or formatting the QR history with icons.
3.  Extra features — I would love to expand into the Photo Album advanced feature, saving pictures with weather + location data, but I know that would require more work with storage and database display logic.

### What surprised you about device hardware integration?

Honestly, I expected camera and QR features to be harder than they were. Expo’s Camera API and Docs made it surprisingly straightforward to get a working QR scanner running quickly. Especially with the code examples given as a starting point.

The surprise came more from the platform differences: on iOS, camera permissions and rendering worked so smoothly, but on the web there were quirks with browser compatibility and needing certain fallbacks. The other challenge was properly executing the location permissions and how they behaved slightly differently on mobile vs web, which forced me to add extra error handling.

```bash
# Permisions - iOS prompt worked seamless
# on Web had to use prompt Alert

const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== "granted") {
  setErrorMsg("Permission to access location was denied");
  return;
}

# Camera fallback --
{Platform.OS === "web" && (
  <Text style={styles.note}>
    Note: QR scanning on web depends on browser camera support.
  </Text>)}
```

Overall, I was surprised at how much easier Expo makes hardware integration, while still requiring careful attention to detail in permissions and cross-platform testing.
