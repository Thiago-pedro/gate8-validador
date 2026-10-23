import { DarkTheme, ThemeProvider, type ErrorBoundaryProps, Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { EventProvider } from '@/lib/event-context';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorScreen}>
      <Text style={styles.errorTitle}>Erro ao abrir a portaria</Text>
      <Text style={styles.errorText}>{error.message}</Text>
      <Pressable onPress={retry} style={styles.retry}>
        <Text style={styles.retryText}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    primary: colors.blue,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <ThemeProvider value={navTheme}>
      <EventProvider>
        <StatusBar style="light" />
        <View style={styles.app}>
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
              animation: 'none',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 500 }} />
            <Stack.Screen name="scan" options={{ animation: 'fade', animationDuration: 500 }} />
          </Stack>
          {Platform.OS === 'android' ? <NavigationBar style="light" /> : null}
          {Platform.OS === 'android' && insets.bottom > 0 ? (
            <View pointerEvents="none" style={[styles.navScrim, { height: insets.bottom }]} />
          ) : null}
        </View>
      </EventProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 40,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  retry: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.text,
    fontWeight: '700',
  },
});
