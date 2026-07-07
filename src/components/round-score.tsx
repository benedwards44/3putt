import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, Divider, Screen, Stepper } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import {
  bestBallState,
  holeStableford,
  matchStatusLabel,
  strokesReceived,
} from '@/lib/golf';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';
import { Round } from '@/types';

export function RoundScore({ round }: { round: Round }) {
  const t = useTheme();
  const setStroke = useStore((s) => s.setStroke);
  const setGamePoints = useStore((s) => s.setGamePoints);
  const setFinished = useStore((s) => s.setFinished);

  // Start on the first hole that isn't fully scored
  const firstOpenHole = useMemo(() => {
    const idx = round.holes.findIndex((_, i) =>
      round.players.some((p) => round.strokes[p.playerId]?.[i] == null)
    );
    return idx === -1 ? round.holes.length - 1 : idx;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [holeIdx, setHoleIdx] = useState(firstOpenHole);
  const hole = round.holes[holeIdx];
  const lastHole = holeIdx === round.holes.length - 1;

  const bb = round.game === 'bestBall' ? bestBallState(round) : null;
  const holeComplete = round.players.every((p) => round.strokes[p.playerId]?.[holeIdx] != null);

  const teamName = (team: 'A' | 'B') =>
    round.players
      .filter((p) => p.team === team)
      .map((p) => p.name.split(' ')[0])
      .join(' & ');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two, paddingBottom: 60 }}>
        {/* Hole header + navigation */}
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
          <NavArrow icon="chevron-back" disabled={holeIdx === 0} onPress={() => setHoleIdx((i) => i - 1)} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>Hole {hole.number}</Text>
            <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>
              Par {hole.par} · Index {hole.strokeIndex}
            </Text>
          </View>
          <NavArrow icon="chevron-forward" disabled={lastHole} onPress={() => setHoleIdx((i) => i + 1)} />
        </Card>

        {/* Hole progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, flexWrap: 'wrap', paddingVertical: 2 }}>
          {round.holes.map((h, i) => {
            const done = round.players.every((p) => round.strokes[p.playerId]?.[i] != null);
            return (
              <Pressable key={h.number} onPress={() => setHoleIdx(i)} hitSlop={4}>
                <View
                  style={{
                    width: i === holeIdx ? 18 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: i === holeIdx ? t.tint : done ? t.tint + '66' : t.backgroundSelected,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Best Ball hole status */}
        {bb ? (
          <Card style={{ paddingVertical: 10, gap: 2, alignItems: 'center', backgroundColor: t.tintSoft, borderColor: 'transparent' }}>
            <Text style={{ color: t.tint, fontWeight: '800', fontSize: 16 }}>
              {matchStatusLabel(bb.diff, teamName('A'), teamName('B'))}
            </Text>
            {holeComplete && bb.holeResults[holeIdx] ? (
              <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {bb.holeResults[holeIdx] === 'draw'
                  ? 'Hole halved'
                  : `Hole won by ${teamName(bb.holeResults[holeIdx] as 'A' | 'B')}`}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {/* Player score entry */}
        {round.players.map((player) => {
          const received = strokesReceived(player.playingHandicap, hole.strokeIndex, round.holes.length);
          const gross = round.strokes[player.playerId]?.[holeIdx] ?? null;
          const points = holeStableford(round, player, holeIdx);
          const gamePts = round.gamePoints[player.playerId]?.[holeIdx] ?? null;

          return (
            <Card key={player.playerId} style={{ gap: Spacing.two }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {player.team ? (
                    <Badge
                      text={player.team}
                      color={player.team === 'A' ? t.tintSoft : t.backgroundSelected}
                      textColor={player.team === 'A' ? t.tint : t.text}
                    />
                  ) : null}
                  <View>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{player.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                        Plays off {player.playingHandicap}
                      </Text>
                      {received !== 0 ? <StrokeDots count={received} /> : null}
                    </View>
                  </View>
                </View>
                {/* Live stableford for the hole */}
                <View style={{ alignItems: 'center', minWidth: 52 }}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: '800',
                      color: points == null ? t.textSecondary : points >= 3 ? t.tint : points === 0 ? t.danger : t.text,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {points ?? '–'}
                  </Text>
                  <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                    PTS
                  </Text>
                </View>
              </View>

              <Divider />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>Strokes</Text>
                <Stepper
                  value={gross}
                  min={1}
                  max={15}
                  initial={hole.par}
                  onChange={(v) => setStroke(round.id, player.playerId, holeIdx, v)}
                />
              </View>

              {(round.game === 'wolf' || round.game === 'sixes') ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {round.game === 'wolf' ? 'Wolf pts' : 'Sixes pts'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => {
                      const selected = gamePts === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => setGamePoints(round.id, player.playerId, holeIdx, selected ? null : n)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: Radius.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected ? t.tint : t.backgroundElement,
                          }}>
                          <Text style={{ color: selected ? t.onTint : t.text, fontWeight: '700', fontSize: 14 }}>
                            {n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })}

        {lastHole ? (
          round.finished ? (
            <Button title="Reopen Round" variant="secondary" onPress={() => setFinished(round.id, false)} />
          ) : (
            <Button title="Finish Round" icon="checkmark-circle" onPress={() => setFinished(round.id, true)} />
          )
        ) : (
          <Button
            title="Next Hole"
            variant={holeComplete ? 'primary' : 'secondary'}
            icon="arrow-forward"
            onPress={() => setHoleIdx((i) => i + 1)}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function NavArrow({
  icon,
  onPress,
  disabled,
}: {
  icon: 'chevron-back' | 'chevron-forward';
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: t.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
      })}>
      <Ionicons name={icon} size={20} color={t.text} />
    </Pressable>
  );
}

/** Dots showing handicap strokes received on this hole (hollow when giving strokes) */
function StrokeDots({ count }: { count: number }) {
  const t = useTheme();
  const giving = count < 0;
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: Math.abs(count) }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: giving ? 'transparent' : t.tint,
            borderWidth: giving ? 1 : 0,
            borderColor: t.danger,
          }}
        />
      ))}
    </View>
  );
}
