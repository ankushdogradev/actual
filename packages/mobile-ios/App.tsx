import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import type { ShouldStartLoadRequest, WebViewErrorEvent, WebViewNavigation } from 'react-native-webview';
import { WebView } from 'react-native-webview';

const DEFAULT_APP_URL = 'http://localhost:3000';

const getConfiguredAppUrl = (): string => {
  const extra = Constants.expoConfig?.extra ?? {};
  const url = typeof extra?.appUrl === 'string' ? extra.appUrl : undefined;
  if (url && url.trim().length > 0) {
    return url.trim();
  }
  return DEFAULT_APP_URL;
};

const isHttpScheme = (url: string) => /^https?:/i.test(url);

const App = (): JSX.Element => {
  const colorScheme = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const appUrl = useMemo(() => getConfiguredAppUrl(), []);

  const allowedHosts = useMemo(() => {
    try {
      const base = new URL(appUrl);
      const hosts = new Set<string>([base.host, 'localhost', '127.0.0.1']);
      if (base.hostname === 'localhost' && base.port) {
        hosts.add(`${base.hostname}:${base.port}`);
      }
      return hosts;
    } catch (error) {
      console.warn('Unable to derive base host from app URL', error);
      return new Set<string>();
    }
  }, [appUrl]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      const { url } = request;

      if (!url) {
        return true;
      }

      if (!isHttpScheme(url) || url.startsWith('about:') || url.startsWith('blob:')) {
        return true;
      }

      try {
        const parsedUrl = new URL(url);
        if (allowedHosts.has(parsedUrl.host)) {
          return true;
        }
      } catch (error) {
        console.warn('Failed to parse target URL', error);
        return false;
      }

      Linking.openURL(url).catch(err => console.error('Unable to open external URL', err));
      return false;
    },
    [allowedHosts],
  );

  const handleNavigationStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack ?? false);
  }, []);

  const handleReload = useCallback(() => {
    setLastError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const handleLoadError = useCallback((event: WebViewErrorEvent) => {
    setLastError(event.nativeEvent.description ?? 'Unknown error');
    setIsLoading(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, colorScheme === 'dark' ? styles.darkBackground : styles.lightBackground]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: appUrl }}
          onLoadStart={() => {
            setLastError(null);
            setIsLoading(true);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleLoadError}
          onHttpError={handleLoadError}
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          pullToRefreshEnabled
          mediaPlaybackRequiresUserAction={false}
          automaticallyAdjustsScrollIndicatorInsets
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          decelerationRate="normal"
          style={styles.webView}
        />
        {(isLoading || lastError) && (
          <View style={[styles.overlay, colorScheme === 'dark' ? styles.darkBackground : styles.lightBackground]}>
            {isLoading && !lastError ? (
              <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#ffffff' : '#111827'} />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorTitle, colorScheme === 'dark' ? styles.errorTitleDark : styles.errorTitleLight]}>
                  Something went wrong
                </Text>
                <Text style={[styles.errorMessage, colorScheme === 'dark' ? styles.errorMessageDark : styles.errorMessageLight]}>
                  {lastError}
                </Text>
                <Pressable
                  onPress={handleReload}
                  style={styles.retryButton}
                  accessibilityRole="button"
                  hitSlop={12}
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webViewWrapper: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorTitleLight: {
    color: '#111827',
  },
  errorTitleDark: {
    color: '#f9fafb',
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  errorMessageLight: {
    color: '#1f2937',
  },
  errorMessageDark: {
    color: '#e5e7eb',
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  lightBackground: {
    backgroundColor: '#f9fafb',
  },
  darkBackground: {
    backgroundColor: '#0b1120',
  },
});

export default App;
