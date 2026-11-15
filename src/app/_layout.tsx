import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();
SplashScreen.hideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const t = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: t.tint,
      background: t.background,
      card: t.card,
      text: t.text,
      border: t.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerBackTitle: 'Back' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course/new" options={{ title: 'New Course', presentation: 'modal' }} />
        <Stack.Screen name="course/[id]" options={{ title: 'Edit Course' }} />
        <Stack.Screen name="round/new" options={{ title: 'New Round', presentation: 'modal' }} />
        <Stack.Screen name="round/[id]" options={{ title: 'Round' }} />
      </Stack>
    </ThemeProvider>
  );
}
