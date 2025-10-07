import type { ExpoConfig, ConfigContext } from 'expo/config';

const DEFAULT_APP_URL = 'http://localhost:3000';

const createConfig = ({ config }: ConfigContext): ExpoConfig => {
  const appUrl = process.env.EXPO_PUBLIC_ACTUAL_URL ?? DEFAULT_APP_URL;

  return {
    ...config,
    name: 'Actual Mobile',
    slug: 'actual-mobile',
    version: '1.0.0',
    orientation: 'default',
    platforms: ['ios'],
    scheme: 'actual',
    userInterfaceStyle: 'automatic',
    icon: '../desktop-client/public/maskable-512x512.png',
    splash: {
      image: '../desktop-client/public/android-chrome-192x192.png',
      resizeMode: 'contain',
      backgroundColor: '#0b1120',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'org.actualbudget.mobile',
      buildNumber: '1.0.0',
      infoPlist: {
        NSCameraUsageDescription: 'Actual requires camera access to scan documents for import.',
        NSPhotoLibraryAddUsageDescription: 'Actual saves exported budgets to your photo library when requested.',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            localhost: {
              NSTemporaryExceptionAllowsInsecureHTTPLoads: true,
              NSTemporaryExceptionMinimumTLSVersion: 'TLSv1.2',
            },
          },
        },
      },
    },
    runtimeVersion: {
      policy: 'nativeVersion',
    },
    extra: {
      ...config.extra,
      appUrl,
    },
    experiments: {
      typedRoutes: true,
    },
  };
};

export default createConfig;
