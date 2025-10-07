# Actual Mobile (iOS)

This package contains an experimental iOS application for Actual. The app is built with Expo and wraps the existing web client inside a secure `WebView`, so you can interact with your self-hosted or locally running Actual instance on iPhone and iPad.

> **Status:** MVP. The initial goal is to make the current web client available on iOS quickly. Native integrations (files, notifications, biometrics, offline sync, etc.) can be layered on top of this foundation later.

## Prerequisites

- Xcode 15 or newer installed on macOS.
- `cocoapods` installed (`sudo gem install cocoapods`).
- Yarn 4 (already configured at the repository root).

## Getting started

1. Install dependencies from the repository root:

   ```sh
   yarn install
   ```

2. Build the Actual web client so the mobile shell can load it. For local development this means running the desktop/web dev server:

   ```sh
   yarn start:browser
   ```

   The mobile app points to `http://localhost:3000` by default. When testing on a device, expose the dev server on your LAN and update the URL (see below).

3. In a separate terminal, launch the Expo development server for iOS:

   ```sh
   yarn workspace @actual-app/mobile-ios start
   ```

4. Press `i` in the Expo CLI UI to open the app in the iOS simulator, or use the Expo Go app / a custom dev client on your device.

### Configuring the backend URL

Set `EXPO_PUBLIC_ACTUAL_URL` before starting the Expo server to point at a reachable Actual instance:

```sh
EXPO_PUBLIC_ACTUAL_URL="http://192.168.0.42:3000" \
  yarn workspace @actual-app/mobile-ios start
```

The URL is stored in Expo configuration and read at runtime by the app shell.

## Producing an iOS build

1. Generate native iOS project files (this step creates the `packages/mobile-ios/ios` directory):

   ```sh
   yarn workspace @actual-app/mobile-ios expo prebuild --platform ios
   ```

2. Open the generated workspace in Xcode and build/archive as usual:

   ```sh
   open packages/mobile-ios/ios/Actual\ Mobile.xcworkspace
   ```

3. Update the bundle identifier or signing configuration in `app.config.ts` before submitting to TestFlight / the App Store.

## Implementation notes

- The shell relies on the existing Actual web UI. Authentication, budgeting flows, and plugins all work the same way they do in the browser.
- External links are opened using the system browser while internal navigation stays within the WebView.
- The WebView preserves cookies and session data so you stay signed in between launches.
- The native wrapper handles dark/light themes automatically and shows a fallback UI if the web app fails to load.

Future iterations can progressively replace the WebView with native screens or add platform-specific enhancements using Expo modules.
