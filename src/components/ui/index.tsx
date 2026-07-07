import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { Fonts, Radius, Spacing, Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ flex: 1, backgroundColor: t.background }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: Radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
          padding: Spacing.three,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const bg: Record<ButtonVariant, string> = {
    primary: t.tint,
    secondary: t.backgroundElement,
    ghost: 'transparent',
    danger: t.danger,
  };
  const fg: Record<ButtonVariant, string> = {
    primary: t.onTint,
    secondary: t.text,
    ghost: t.tint,
    danger: '#fff',
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg[variant],
          borderRadius: Radius.md,
          paddingVertical: 14,
          paddingHorizontal: Spacing.four,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.two,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={fg[variant]} /> : null}
      <Text style={{ color: fg[variant], fontWeight: '600', fontSize: 16, fontFamily: Fonts?.sans }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function TextField({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <FieldLabel text={label} /> : null}
      <TextInput
        placeholderTextColor={t.textSecondary}
        {...props}
        style={[
          {
            backgroundColor: t.backgroundElement,
            color: t.text,
            borderRadius: Radius.md,
            paddingHorizontal: Spacing.three,
            paddingVertical: 12,
            fontSize: 16,
          },
          style,
        ]}
      />
    </View>
  );
}

export function FieldLabel({ text }: { text: string }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {text}
    </Text>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.backgroundElement,
        borderRadius: Radius.md,
        padding: 3,
      }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: Radius.md - 3,
              backgroundColor: selected ? t.card : 'transparent',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: selected ? t.text : t.textSecondary,
                fontWeight: selected ? '700' : '500',
                fontSize: 14,
              }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  dot,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dot?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radius.full,
        backgroundColor: selected ? t.tintSoft : t.backgroundElement,
        borderWidth: 1,
        borderColor: selected ? t.tint : 'transparent',
      }}>
      {dot ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dot,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
          }}
        />
      ) : null}
      <Text style={{ color: selected ? t.tint : t.text, fontWeight: '600', fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  initial,
  display,
  compact,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  /** Value jumped to on the first tap when nothing is entered yet */
  initial?: number;
  /** Custom text shown for the value */
  display?: string;
  compact?: boolean;
}) {
  const t = useTheme();
  const size = compact ? 34 : 44;
  const step = (delta: number) => {
    const next = value == null ? (initial ?? min) : value + delta;
    onChange(Math.min(max, Math.max(min, next)));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 6 : 10 }}>
      <StepButton icon="remove" size={size} onPress={() => step(-1)} disabled={value != null && value <= min} />
      <Text
        style={{
          minWidth: compact ? 30 : 40,
          textAlign: 'center',
          fontSize: compact ? 18 : 24,
          fontWeight: '700',
          color: value == null ? t.textSecondary : t.text,
          fontVariant: ['tabular-nums'],
        }}>
        {display ?? (value == null ? '–' : String(value))}
      </Text>
      <StepButton icon="add" size={size} onPress={() => step(1)} disabled={value != null && value >= max} />
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  size,
  disabled,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  size: number;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
      })}>
      <Ionicons name={icon} size={size * 0.5} color={t.text} />
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: Spacing.six, gap: Spacing.two, paddingHorizontal: Spacing.four }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: t.tintSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.two,
        }}>
        <Ionicons name={icon} size={30} color={t.tint} />
      </View>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: t.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 21 }}>
        {message}
      </Text>
    </View>
  );
}

export function Badge({ text, color, textColor }: { text: string; color?: string; textColor?: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: color ?? t.tintSoft,
        borderRadius: Radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}>
      <Text style={{ color: textColor ?? t.tint, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

export function useThemeColors(): Theme {
  return useTheme();
}
