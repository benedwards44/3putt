import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Badge, Button, Card, Chip, FieldLabel, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { formatHandicap } from '@/lib/format';
import { playingHandicap } from '@/lib/golf';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';
import { GAME_LABELS, GameType, TeamId } from '@/types';

const GAME_DESCRIPTIONS: Record<GameType, string> = {
  none: 'Strokes and stableford points only.',
  bestBall: '2 v 2 match play. Each hole goes to the team whose best player scores the most stableford points.',
  wolf: 'Award each player 0–6 points per hole, running total.',
  sixes: 'Award each player 0–6 points per hole, running total.',
};

export default function NewRoundScreen() {
  const router = useRouter();
  const t = useTheme();
  const courses = useStore((s) => s.courses);
  const players = useStore((s) => s.players);
  const createRound = useStore((s) => s.createRound);

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const course = courses.find((c) => c.id === courseId);
  const [teeId, setTeeId] = useState(course?.tees[0]?.id ?? '');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [game, setGame] = useState<GameType>('none');
  const [teams, setTeams] = useState<Record<string, TeamId>>({});
  const [tiebreaker, setTiebreaker] = useState(true);

  const tee = course?.tees.find((x) => x.id === teeId) ?? course?.tees[0];

  const selectCourse = (id: string) => {
    setCourseId(id);
    const c = courses.find((x) => x.id === id);
    setTeeId(c?.tees[0]?.id ?? '');
  };

  const togglePlayer = (id: string) =>
    setSelectedPlayers((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const cycleTeam = (id: string) =>
    setTeams((prev) => ({ ...prev, [id]: prev[id] === 'A' ? 'B' : 'A' }));

  const handicaps = useMemo(() => {
    if (!course || !tee) return {};
    return Object.fromEntries(
      selectedPlayers.map((pid) => {
        const p = players.find((pl) => pl.id === pid)!;
        return [pid, playingHandicap(p.handicapIndex, tee, course.holes)];
      })
    );
  }, [course, tee, selectedPlayers, players]);

  const start = () => {
    if (!course || !tee) return Alert.alert('Select a course and tee');
    if (selectedPlayers.length === 0) return Alert.alert('Select at least one player');
    if (game === 'bestBall') {
      if (selectedPlayers.length !== 4) return Alert.alert('Best Ball needs exactly 4 players');
      const a = selectedPlayers.filter((p) => (teams[p] ?? 'A') === 'A').length;
      if (a !== 2) return Alert.alert('Teams must be 2 v 2', 'Tap players in the team section to switch their team.');
    }
    const id = createRound({
      course,
      teeId: tee.id,
      playerIds: selectedPlayers,
      game,
      secondPlayerTiebreaker: game === 'bestBall' ? tiebreaker : false,
      teams: Object.fromEntries(selectedPlayers.map((p) => [p, teams[p] ?? 'A'])),
    });
    router.dismiss();
    router.push(`/round/${id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.four, paddingBottom: 60 }}>
        <View style={{ gap: Spacing.two }}>
          <FieldLabel text="Course" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {courses.map((c) => (
              <Chip key={c.id} label={c.name} selected={c.id === courseId} onPress={() => selectCourse(c.id)} />
            ))}
          </View>
        </View>

        {course ? (
          <View style={{ gap: Spacing.two }}>
            <FieldLabel text="Tee" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {course.tees.map((x) => (
                <Chip
                  key={x.id}
                  label={`${x.name} · ${x.courseRating}/${x.slopeRating}`}
                  dot={x.color}
                  selected={x.id === tee?.id}
                  onPress={() => setTeeId(x.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ gap: Spacing.two }}>
          <FieldLabel text="Players" />
          {players.map((p) => {
            const selected = selectedPlayers.includes(p.id);
            return (
              <Pressable key={p.id} onPress={() => togglePlayer(p.id)}>
                <Card
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderColor: selected ? t.tint : t.border,
                    borderWidth: 1,
                  }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{p.name}</Text>
                    <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                      Handicap {formatHandicap(p.handicapIndex)}
                    </Text>
                  </View>
                  {selected && handicaps[p.id] != null ? (
                    <Badge text={`Plays off ${handicaps[p.id]}`} />
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: Spacing.two }}>
          <FieldLabel text="Game" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(GAME_LABELS) as GameType[]).map((g) => (
              <Chip key={g} label={GAME_LABELS[g]} selected={game === g} onPress={() => setGame(g)} />
            ))}
          </View>
          <Text style={{ color: t.textSecondary, fontSize: 13, lineHeight: 18 }}>{GAME_DESCRIPTIONS[game]}</Text>
        </View>

        {game === 'bestBall' ? (
          <View style={{ gap: Spacing.two }}>
            <FieldLabel text="Teams (tap to switch)" />
            {selectedPlayers.length !== 4 ? (
              <Text style={{ color: t.warning, fontSize: 13 }}>Select exactly 4 players for Best Ball.</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              {(['A', 'B'] as TeamId[]).map((team) => (
                <View
                  key={team}
                  style={{
                    flex: 1,
                    gap: 8,
                    backgroundColor: t.backgroundElement,
                    borderRadius: Radius.md,
                    padding: Spacing.two,
                  }}>
                  <Text style={{ color: t.textSecondary, fontWeight: '700', fontSize: 12, textAlign: 'center' }}>
                    TEAM {team}
                  </Text>
                  {selectedPlayers
                    .filter((p) => (teams[p] ?? 'A') === team)
                    .map((pid) => (
                      <Chip
                        key={pid}
                        label={players.find((pl) => pl.id === pid)?.name ?? ''}
                        onPress={() => cycleTeam(pid)}
                      />
                    ))}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two }}>
              <View style={{ flex: 1, paddingRight: Spacing.three }}>
                <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>Second player tiebreaker</Text>
                <Text style={{ color: t.textSecondary, fontSize: 12, lineHeight: 17 }}>
                  If the best players draw, the hole is decided by the second players&apos; scores.
                </Text>
              </View>
              <Switch value={tiebreaker} onValueChange={setTiebreaker} trackColor={{ true: t.tint }} />
            </View>
          </View>
        ) : null}

        <Button title="Start Round" icon="golf" onPress={start} />
      </ScrollView>
    </Screen>
  );
}
