import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';
import { GAME_LABELS, Round } from '@/types';

export default function RoundsScreen() {
  const router = useRouter();
  const t = useTheme();
  const rounds = useStore((s) => s.rounds);
  const deleteRound = useStore((s) => s.deleteRound);
  const canStart = useStore((s) => s.courses.length > 0 && s.players.length > 0);

  const sorted = [...rounds].sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? 1 : -1;
    return b.startedAt.localeCompare(a.startedAt);
  });

  const confirmDelete = (round: Round) =>
    Alert.alert('Delete round?', `${round.courseName} — this can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRound(round.id) },
    ]);

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 }}
        ListEmptyComponent={
          <EmptyState
            icon="golf"
            title="No rounds yet"
            message={
              canStart
                ? 'Start a round to begin scoring with your group.'
                : 'Add a course and some players first, then start your first round.'
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/round/${item.id}`)} onLongPress={() => confirmDelete(item)}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{item.courseName}</Text>
                  <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                    {new Date(item.startedAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {'  ·  '}
                    {item.players.map((p) => p.name).join(', ')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Badge text={GAME_LABELS[item.game]} />
                  {item.finished ? (
                    <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: '600' }}>Finished</Text>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.tint }} />
                      <Text style={{ color: t.tint, fontSize: 12, fontWeight: '700' }}>Live</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <View style={{ position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.four }}>
        {canStart ? (
          <Button title="New Round" icon="add" onPress={() => router.push('/round/new')} />
        ) : (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Ionicons name="information-circle" size={20} color={t.textSecondary} />
            <Text style={{ color: t.textSecondary, flex: 1, fontSize: 13 }}>
              Add at least one course and one player to start a round.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
