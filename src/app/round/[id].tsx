import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { RoundLeaderboard } from '@/components/round-leaderboard';
import { RoundScore } from '@/components/round-score';
import { EmptyState, Screen, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export default function RoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const round = useStore((s) => s.rounds.find((r) => r.id === id));
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
      <Stack.Screen options={{ title: round.courseName }} />
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
