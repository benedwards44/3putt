import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  FieldLabel,
  Screen,
  Segmented,
  TextField,
} from '@/components/ui';
import { Radius, Spacing, TEE_COLORS } from '@/constants/theme';
import { makeId } from '@/lib/id';
import { useTheme } from '@/hooks/use-theme';
import { Course, HoleInfo, Tee } from '@/types';

const defaultHoles = (count: number): HoleInfo[] =>
  Array.from({ length: count }, (_, i) => ({ number: i + 1, par: 4, strokeIndex: i + 1 }));

export function CourseForm({
  initial,
  onSave,
  onDelete,
}: {
  initial?: Course;
  onSave: (course: Omit<Course, 'id'>) => void;
  /** Shown as a "Delete Course" button when editing an existing course. */
  onDelete?: () => void;
}) {
  const t = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [holes, setHoles] = useState<HoleInfo[]>(initial?.holes ?? defaultHoles(18));
  const [tees, setTees] = useState<Tee[]>(initial?.tees ?? []);

  const setHoleCount = (count: number) => {
    setHoles((prev) =>
      prev.length === count
        ? prev
        : count < prev.length
          ? prev.slice(0, count)
          : [...prev, ...defaultHoles(count).slice(prev.length)]
    );
  };

  const updateHole = (idx: number, patch: Partial<HoleInfo>) =>
    setHoles((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));

  const addTee = () =>
    setTees((prev) => {
      const swatch = TEE_COLORS[prev.length % TEE_COLORS.length];
      return [
        ...prev,
        { id: makeId(), name: swatch.name, color: swatch.color, courseRating: holes.length === 9 ? 36 : 72, slopeRating: 113 },
      ];
    });

  const updateTee = (id: string, patch: Partial<Tee>) =>
    setTees((prev) => prev.map((tee) => (tee.id === id ? { ...tee, ...patch } : tee)));

  const removeTee = (id: string) => setTees((prev) => prev.filter((tee) => tee.id !== id));

  const save = () => {
    if (!name.trim()) return Alert.alert('Course name required');
    if (tees.length === 0) return Alert.alert('Add at least one tee', 'A tee needs a course rating and slope so playing handicaps can be calculated.');
    const siSet = new Set(holes.map((h) => h.strokeIndex));
    if (siSet.size !== holes.length) {
      return Alert.alert('Duplicate stroke indexes', 'Each hole needs a unique stroke index so handicap strokes are allocated correctly.');
    }
    onSave({ name: name.trim(), holes, tees });
  };

  const par = holes.reduce((s, h) => s + h.par, 0);

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three, paddingBottom: 60 }}>
          <TextField label="Course name" value={name} onChangeText={setName} placeholder="e.g. Paraparaumu Beach" />

          <View style={{ gap: 6 }}>
            <FieldLabel text="Holes" />
            <Segmented
              options={[
                { value: '9', label: '9 holes' },
                { value: '18', label: '18 holes' },
              ]}
              value={String(holes.length) as '9' | '18'}
              onChange={(v) => setHoleCount(Number(v))}
            />
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <FieldLabel text="Tees" />
              <Pressable onPress={addTee} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="add-circle" size={20} color={t.tint} />
                <Text style={{ color: t.tint, fontWeight: '600' }}>Add tee</Text>
              </Pressable>
            </View>
            {tees.length === 0 ? (
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                Add each tee with its course rating and slope — used to calculate playing handicaps.
              </Text>
            ) : null}
            {tees.map((tee) => (
              <TeeEditor key={tee.id} tee={tee} holeCount={holes.length} onChange={(patch) => updateTee(tee.id, patch)} onRemove={() => removeTee(tee.id)} />
            ))}
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <FieldLabel text="Hole details" />
              <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>Par {par}</Text>
            </View>
            <Card style={{ padding: 0 }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.three, paddingVertical: 10 }}>
                <Text style={[styles.colHole, { color: t.textSecondary, fontSize: 12, fontWeight: '700' }]}>HOLE</Text>
                <Text style={[styles.colPar, { color: t.textSecondary, fontSize: 12, fontWeight: '700' }]}>PAR</Text>
                <Text style={[styles.colSI, { color: t.textSecondary, fontSize: 12, fontWeight: '700' }]}>STROKE INDEX</Text>
              </View>
              <Divider />
              {holes.map((hole, i) => (
                <View key={hole.number}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: 8 }}>
                    <Text style={[styles.colHole, { color: t.text, fontWeight: '700', fontSize: 16 }]}>{hole.number}</Text>
                    <View style={styles.colPar}>
                      <ParPicker value={hole.par} onChange={(par) => updateHole(i, { par })} />
                    </View>
                    <View style={styles.colSI}>
                      <NumberInput
                        value={hole.strokeIndex}
                        min={1}
                        max={holes.length}
                        onChange={(strokeIndex) => updateHole(i, { strokeIndex })}
                      />
                    </View>
                  </View>
                  {i < holes.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          </View>

          <Button title={initial ? 'Save Changes' : 'Save Course'} onPress={save} />
          {onDelete ? <Button title="Delete Course" icon="trash-outline" variant="danger" onPress={onDelete} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ParPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[3, 4, 5].map((p) => {
        const selected = value === p;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? t.tint : t.backgroundElement,
            }}>
            <Text style={{ color: selected ? t.onTint : t.text, fontWeight: '700' }}>{p}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  width = 64,
  allowDecimal,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  width?: number;
  allowDecimal?: boolean;
}) {
  const t = useTheme();
  const [text, setText] = useState(String(value));
  return (
    <TextInput
      value={text}
      keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
      onChangeText={setText}
      onEndEditing={() => {
        const n = allowDecimal ? parseFloat(text) : parseInt(text, 10);
        if (Number.isFinite(n)) {
          const clamped = Math.min(max, Math.max(min, n));
          onChange(clamped);
          setText(String(clamped));
        } else {
          setText(String(value));
        }
      }}
      style={{
        backgroundColor: t.backgroundElement,
        color: t.text,
        borderRadius: Radius.sm,
        paddingVertical: 6,
        width,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
      }}
    />
  );
}

function TeeEditor({
  tee,
  holeCount,
  onChange,
  onRemove,
}: {
  tee: Tee;
  holeCount: number;
  onChange: (patch: Partial<Tee>) => void;
  onRemove: () => void;
}) {
  const t = useTheme();
  // 9-hole course ratings are roughly half an 18-hole rating (typically ~30–40).
  const [ratingMin, ratingMax] = holeCount === 9 ? [25, 45] : [50, 90];
  return (
    <Card style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {TEE_COLORS.map((swatch) => (
          <Chip
            key={swatch.name}
            label={swatch.name}
            dot={swatch.color}
            selected={tee.name === swatch.name}
            onPress={() => onChange({ name: swatch.name, color: swatch.color })}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three }}>
        <View style={{ gap: 6 }}>
          <FieldLabel text="Course rating" />
          <NumberInput value={tee.courseRating} min={ratingMin} max={ratingMax} allowDecimal width={80} onChange={(courseRating) => onChange({ courseRating })} />
        </View>
        <View style={{ gap: 6 }}>
          <FieldLabel text="Slope" />
          <NumberInput value={tee.slopeRating} min={55} max={155} width={80} onChange={(slopeRating) => onChange({ slopeRating })} />
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onRemove} hitSlop={8} style={{ paddingBottom: 8 }}>
          <Ionicons name="trash-outline" size={20} color={t.danger} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  colHole: { width: 56 },
  colPar: { flex: 1 },
  colSI: { width: 110, alignItems: 'flex-start' as const },
});
