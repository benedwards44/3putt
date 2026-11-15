import type { HoleInfo, Round, RoundPlayer, TeamId, Tee } from '../types';

/**
 * WHS course (playing) handicap:
 *   Handicap Index × (Slope ÷ 113) + (Course Rating − Par), rounded to nearest.
 * Players always enter their normal (18-hole) Handicap Index; for a 9-hole
 * course WHS uses half of it, alongside the 9-hole course rating and par.
 */
export function playingHandicap(handicapIndex: number, tee: Tee, holes: HoleInfo[]): number {
  const par = holes.reduce((sum, h) => sum + h.par, 0);
  const index = holes.length === 9 ? handicapIndex / 2 : handicapIndex;
  return Math.round(index * (tee.slopeRating / 113) + (tee.courseRating - par));
}

/**
 * Strokes received on a hole given a playing handicap and the hole's stroke index.
 * A 24-handicap gets 2 strokes on SI 1-6 and 1 stroke elsewhere. Plus handicaps
 * give strokes back starting from the easiest hole (SI 18).
 */
export function strokesReceived(ph: number, strokeIndex: number, holeCount = 18): number {
  if (ph >= 0) {
    return Math.floor(ph / holeCount) + (strokeIndex <= ph % holeCount ? 1 : 0);
  }
  const give = -ph;
  // `|| 0` normalises -0
  return -(Math.floor(give / holeCount) + (strokeIndex > holeCount - (give % holeCount) ? 1 : 0)) || 0;
}

/**
 * Stableford points for a gross score: 2 for net par, +1 per stroke better,
 * floor of 0 at net double bogey or worse.
 */
export function stablefordPoints(gross: number, par: number, received: number): number {
  const net = gross - received;
  return Math.max(0, 2 + par - net);
}

export function holeStableford(round: Round, player: RoundPlayer, holeIdx: number): number | null {
  const gross = round.strokes[player.playerId]?.[holeIdx];
  if (gross == null) return null;
  const hole = round.holes[holeIdx];
  const received = strokesReceived(player.playingHandicap, hole.strokeIndex, round.holes.length);
  return stablefordPoints(gross, hole.par, received);
}

export interface PlayerTotals {
  playerId: string;
  name: string;
  grossStrokes: number;
  stableford: number;
  holesPlayed: number;
  gamePoints: number;
}

export function playerTotals(round: Round, player: RoundPlayer): PlayerTotals {
  let grossStrokes = 0;
  let stableford = 0;
  let holesPlayed = 0;
  let gamePoints = 0;
  round.holes.forEach((_, i) => {
    const gross = round.strokes[player.playerId]?.[i];
    if (gross != null) {
      grossStrokes += gross;
      stableford += holeStableford(round, player, i) ?? 0;
      holesPlayed += 1;
    }
    gamePoints += round.gamePoints[player.playerId]?.[i] ?? 0;
  });
  return { playerId: player.playerId, name: player.name, grossStrokes, stableford, holesPlayed, gamePoints };
}

export type HoleResult = TeamId | 'draw' | null;

export interface BestBallState {
  /** Result of each hole (null = not fully scored yet) */
  holeResults: HoleResult[];
  /** Cumulative score after each hole: positive = Team A up */
  runningDiff: number[];
  /** Current match score: positive = Team A up */
  diff: number;
  /** Number of holes with a result */
  holesDecided: number;
}

/**
 * Best Ball match play. Each hole is won by the team whose best player scored
 * the most stableford points. With the second-player tiebreaker on, drawn top
 * scores are settled by the teams' second players.
 */
export function bestBallState(round: Round): BestBallState {
  const teamPlayers = (team: TeamId) => round.players.filter((p) => p.team === team);
  const holeResults: HoleResult[] = [];
  const runningDiff: number[] = [];
  let diff = 0;
  let holesDecided = 0;

  round.holes.forEach((_, i) => {
    const scores = (team: TeamId) =>
      teamPlayers(team).map((p) => holeStableford(round, p, i));

    const a = scores('A');
    const b = scores('B');
    const complete =
      a.length > 0 && b.length > 0 && [...a, ...b].every((s) => s != null);

    if (!complete) {
      holeResults.push(null);
      runningDiff.push(diff);
      return;
    }

    const sortedA = (a as number[]).slice().sort((x, y) => y - x);
    const sortedB = (b as number[]).slice().sort((x, y) => y - x);

    let result: HoleResult = 'draw';
    if (sortedA[0] !== sortedB[0]) {
      result = sortedA[0] > sortedB[0] ? 'A' : 'B';
    } else if (round.secondPlayerTiebreaker && sortedA.length > 1 && sortedB.length > 1) {
      if (sortedA[1] !== sortedB[1]) result = sortedA[1] > sortedB[1] ? 'A' : 'B';
    }

    if (result === 'A') diff += 1;
    if (result === 'B') diff -= 1;
    holesDecided += 1;
    holeResults.push(result);
    runningDiff.push(diff);
  });

  return { holeResults, runningDiff, diff, holesDecided };
}

/** e.g. "Team A 2 UP", "All Square" */
export function matchStatusLabel(diff: number, teamAName = 'Team A', teamBName = 'Team B'): string {
  if (diff === 0) return 'All Square';
  const team = diff > 0 ? teamAName : teamBName;
  return `${team} ${Math.abs(diff)} UP`;
}

/** Score relative to par formatted like "E", "+3", "-2" */
export function toParLabel(strokes: number, parPlayed: number): string {
  const d = strokes - parPlayed;
  if (d === 0) return 'E';
  return d > 0 ? `+${d}` : `${d}`;
}

export function parForHolesPlayed(round: Round, playerId: string): number {
  return round.holes.reduce(
    (sum, h, i) => (round.strokes[playerId]?.[i] != null ? sum + h.par : sum),
    0
  );
}
