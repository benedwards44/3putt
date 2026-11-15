import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { Button, Card, EmptyState, Screen, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatHandicap } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';
import { Player } from '@/types';

export default function PlayersScreen() {
  const t = useTheme();
  const players = useStore((s) => s.players);
  const addPlayer = useStore((s) => s.addPlayer);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const deletePlayer = useStore((s) => s.deletePlayer);

  // null = closed, 'new' = adding, otherwise editing that player id
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [handicap, setHandicap] = useState('');

  const open = (player?: Player) => {
    setEditing(player?.id ?? 'new');
    setName(player?.name ?? '');
    setHandicap(player ? formatHandicap(player.handicapIndex) : '');
  };

  const save = () => {
    const trimmed = name.trim();
    // "+2" means a plus handicap (better than scratch), stored negative
    const hi = handicap.trim().startsWith('+')
      ? -Math.abs(parseFloat(handicap.trim().slice(1)))
      : parseFloat(handicap.trim());
    if (!trimmed) return Alert.alert('Name required');
    if (!Number.isFinite(hi) || hi < -10 || hi > 54) {
      return Alert.alert('Invalid handicap', 'Enter a handicap index like 12.4, 0, or +2 for plus handicaps.');
    }
    if (editing === 'new') addPlayer({ name: trimmed, handicapIndex: hi });
    else if (editing) updatePlayer({ id: editing, name: trimmed, handicapIndex: hi });
    setEditing(null);
  };

  const confirmDelete = (player: Player) =>
    Alert.alert('Delete player?', `${player.name} will be removed. Past rounds keep their scores.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (editing === player.id) setEditing(null);
          deletePlayer(player.id);
        },
      },
    ]);

  const editingPlayer = players.find((p) => p.id === editing);

  return (
    <Screen>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 }}
        ListHeaderComponent={
          editing !== null ? (
            <Card style={{ gap: Spacing.two, marginBottom: Spacing.two }}>
              <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Ben" autoFocus />
              <TextField
                label="Handicap index"
                value={handicap}
                onChangeText={setHandicap}
                placeholder="e.g. 12.4 (or +2 for plus)"
                keyboardType="numbers-and-punctuation"
              />
              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} style={{ flex: 1 }} />
                <Button title="Save" onPress={save} style={{ flex: 1 }} />
              </View>
              {editingPlayer ? (
                <Button
                  title="Delete Player"
                  icon="trash-outline"
                  variant="danger"
                  onPress={() => confirmDelete(editingPlayer)}
                />
              ) : null}
            </Card>
          ) : null
        }
        ListEmptyComponent={
          editing === null ? (
            <EmptyState
              icon="people"
              title="No players yet"
              message="Add your regular playing group with their handicap index. Playing handicaps are worked out per round."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} onLongPress={() => confirmDelete(item)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: t.tintSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: t.tint, fontWeight: '800', fontSize: 16 }}>
                  {item.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                  Handicap {formatHandicap(item.handicapIndex)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
            </Card>
          </Pressable>
        )}
      />
      {editing === null ? (
        <View style={{ position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.four }}>
          <Button title="Add Player" icon="add" onPress={() => open()} />
        </View>
      ) : null}
    </Screen>
  );
}
