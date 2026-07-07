import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111614',
    textSecondary: '#5F6B65',
    background: '#F6F8F6',
    card: '#FFFFFF',
    backgroundElement: '#EDF1EE',
    backgroundSelected: '#DEE7E1',
    border: '#E2E8E4',
    tint: '#177245',
    tintSoft: '#E2F2E9',
    onTint: '#FFFFFF',
    danger: '#C43D3D',
    warning: '#B07C10',
    gold: '#B07C10',
  },
  dark: {
    text: '#ECF1EE',
    textSecondary: '#98A59E',
    background: '#0F1311',
    card: '#191F1C',
    backgroundElement: '#212925',
    backgroundSelected: '#2C3630',
    border: '#28312C',
    tint: '#3DB273',
    tintSoft: '#1B3327',
    onTint: '#07130C',
    danger: '#E06C6C',
    warning: '#D9A83C',
    gold: '#D9A83C',
  },
} as const;

export type Theme = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Swatches available when creating a tee */
export const TEE_COLORS = [
  { name: 'Blue', color: '#2563EB' },
  { name: 'White', color: '#E5E7EB' },
  { name: 'Yellow', color: '#EAB308' },
  { name: 'Red', color: '#DC2626' },
  { name: 'Black', color: '#111827' },
  { name: 'Gold', color: '#B07C10' },
  { name: 'Green', color: '#177245' },
] as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const MaxContentWidth = 800;
