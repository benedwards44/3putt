import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card, Divider, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import {
  bestBallState,
  matchStatusLabel,
  parForHolesPlayed,
  playerTotals,
  toParLabel,
} from '@/lib/golf';
import { useTheme } from '@/hooks/use-theme';
import { GAME_LABELS, Round } from '@/types';

export function RoundLeaderboard({ round }: { round: Round }) {
  const t = useTheme();
  const isPointsGame = round.game === 'wolf' || round.game === 'sixes';

  const totals = round.players
    .map((p) => ({ player: p, ...playerTotals(round, p) }))
    .sort((a, b) =>
      isPointsGame ? b.gamePoints - a.gamePoints || b.stableford - a.stableford : b.stableford - a.stableford
    );

  const bb = round.game === 'bestBall' ? bestBallState(round) : null;
  const teamName = (team: 'A' | 'B') =>
    round.players
      .filter((p) => p.team === team)
      .map((p) => p.name.split(' ')[0])
      .join(' & ');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two, paddingBottom: 60 }}>
        {/* Best Ball match card */}
        {bb ? (
          <Card style={{ alignItems: 'center', gap: Spacing.two, backgroundColor: t.tintSoft, borderColor: 'transparent' }}>
            <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
              BEST BALL · {bb.holesDecided} OF {round.holes.length} HOLES
            </Text>
            <Text style={{ color: t.tint, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
              {matchStatusLabel(bb.diff, teamName('A'), teamName('B'))}
            </Text>
            {/* Per-hole result strip */}
            <View style={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
              {bb.holeResults.map((r, i) => (
                <View
                  key={i}
                  style={{
                    width: 16,
                    height: 20,
                    borderRadius: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      r === 'A' ? t.tint : r === 'B' ? t.danger : r === 'draw' ? t.backgroundSelected : t.card,
                  }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: r === 'A' || r === 'B' ? '#fff' : t.textSecondary,
                    }}>
                    {r === 'draw' ? '½' : (r ?? i + 1)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.three }}>
              <LegendDot color={t.tint} label={teamName('A')} />
              <LegendDot color={t.danger} label={teamName('B')} />
            </View>
          </Card>
        ) : null}

        {/* Player standings */}
        <Card style={{ padding: 0 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.three, paddingVertical: 10 }}>
            <Text style={[hdr(t), { flex: 1 }]}>PLAYER</Text>
            <Text style={[hdr(t), { width: 62, textAlign: 'center' }]}>GROSS</Text>
            <Text style={[hdr(t), { width: 46, textAlign: 'center' }]}>PTS</Text>
            {isPointsGame ? (
              <Text style={[hdr(t), { width: 52, textAlign: 'center' }]}>
                {round.game === 'wolf' ? 'WOLF' : 'SIXES'}
              </Text>
            ) : null}
            <Text style={[hdr(t), { width: 44, textAlign: 'right' }]}>THRU</Text>
          </View>
          <Divider />
          {totals.map((row, idx) => {
            const par = parForHolesPlayed(round, row.playerId);
            return (
              <View key={row.playerId}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: 12 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: idx === 0 ? t.gold : t.textSecondary, fontWeight: '800', width: 18 }}>
                      {idx + 1}
                    </Text>
                    <View>
                      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                        {row.name}
                        {row.player.team ? (
                          <Text style={{ color: t.textSecondary, fontSize: 12 }}>  ·  Team {row.player.team}</Text>
                        ) : null}
                      </Text>
                      <Text style={{ color: t.textSecondary, fontSize: 11 }}>
                        Plays off {row.player.playingHandicap}
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 62, alignItems: 'center' }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                      {row.holesPlayed ? row.grossStrokes : '–'}
                    </Text>
                    {row.holesPlayed ? (
                      <Text style={{ color: t.textSecondary, fontSize: 11, fontVariant: ['tabular-nums'] }}>
                        {toParLabel(row.grossStrokes, par)}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      width: 46,
                      textAlign: 'center',
                      color: t.tint,
                      fontWeight: '800',
                      fontSize: 16,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {row.stableford}
                  </Text>
                  {isPointsGame ? (
                    <Text
                      style={{
                        width: 52,
                        textAlign: 'center',
                        color: t.text,
                        fontWeight: '800',
                        fontSize: 16,
                        fontVariant: ['tabular-nums'],
                      }}>
                      {row.gamePoints}
                    </Text>
                  ) : null}
                  <Text style={{ width: 44, textAlign: 'right', color: t.textSecondary, fontVariant: ['tabular-nums'] }}>
                    {row.holesPlayed || '–'}
                  </Text>
                </View>
                {idx < totals.length - 1 ? <Divider /> : null}
              </View>
            );
          })}
        </Card>

        <Text style={{ color: t.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
          {GAME_LABELS[round.game]} · {round.courseName} · {round.teeName} tees
        </Text>
      </ScrollView>
    </Screen>
  );
}

function hdr(t: { textSecondary: string }) {
  return { color: t.textSecondary, fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 };
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
