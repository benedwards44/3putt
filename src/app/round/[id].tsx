import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { RoundLeaderboard } from '@/components/round-leaderboard';
import { RoundScore } from '@/components/round-score';
import { EmptyState, Screen, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';

export default function RoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const round = useStore((s) => s.rounds.find((r) => r.id === id));
  const deleteRound = useStore((s) => s.deleteRound);
  const [view, setView] = useState<'score' | 'leaderboard'>('score');

  if (!round) {
    return (
      <Screen>
        <EmptyState icon="alert-circle" title="Round not found" message="This round may have been deleted." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: round.courseName,
          headerRight: () => (
            <Pressable
              accessibilityLabel="Delete round"
              hitSlop={8}
              onPress={() =>
                Alert.alert('Delete round?', `${round.courseName} — this can't be undone.`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      router.back();
                      deleteRound(round.id);
                    },
                  },
                ])
              }>
              <Ionicons name="trash-outline" size={22} color={t.danger} />
            </Pressable>
          ),
        }}
      />
      <View style={{ paddingHorizontal: Spacing.three, paddingTop: Spacing.two }}>
        <Segmented
          options={[
            { value: 'score', label: 'Score Entry' },
            { value: 'leaderboard', label: 'Leaderboard' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>
      {view === 'score' ? <RoundScore round={round} /> : <RoundLeaderboard round={round} />}
    </Screen>
  );
}
