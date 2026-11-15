import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bestBallState,
  matchStatusLabel,
  playingHandicap,
  stablefordPoints,
  strokesReceived,
} from './golf.ts';
import type { HoleInfo, Round, RoundPlayer, Tee } from '../types/index.ts';

const holes18: HoleInfo[] = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: 4,
  strokeIndex: i + 1,
}));

test('playing handicap follows WHS formula', () => {
  const tee: Tee = { id: 't', name: 'White', color: '#fff', courseRating: 71.2, slopeRating: 128 };
  // 12.4 × (128/113) + (71.2 − 72) = 14.05 − 0.8 = 13.2 → 13
  assert.equal(playingHandicap(12.4, tee, holes18), 13);
  // Scratch on a standard course
  const std: Tee = { id: 't', name: 'W', color: '#fff', courseRating: 72, slopeRating: 113 };
  assert.equal(playingHandicap(0, std, holes18), 0);
  // Plus handicap
  assert.equal(playingHandicap(-2, std, holes18), -2);
});

test('playing handicap halves the 18-hole index on a 9-hole course', () => {
  const holes9 = holes18.slice(0, 9); // par 36
  const tee: Tee = { id: 't', name: 'White', color: '#fff', courseRating: 35, slopeRating: 120 };
  // (20 ÷ 2) × (120/113) + (35 − 36) = 10.62 − 1 = 9.62 → 10
  assert.equal(playingHandicap(20, tee, holes9), 10);
  const std: Tee = { id: 't', name: 'W', color: '#fff', courseRating: 36, slopeRating: 113 };
  assert.equal(playingHandicap(0, std, holes9), 0);
  assert.equal(playingHandicap(-2, std, holes9), -1);
});

test('strokes received allocates by stroke index', () => {
  // 13 handicap: 1 stroke on SI 1..13, none on 14..18
  assert.equal(strokesReceived(13, 1), 1);
  assert.equal(strokesReceived(13, 13), 1);
  assert.equal(strokesReceived(13, 14), 0);
  // 24 handicap: 2 strokes on SI 1..6, 1 stroke on SI 7..18
  assert.equal(strokesReceived(24, 6), 2);
  assert.equal(strokesReceived(24, 7), 1);
  assert.equal(strokesReceived(24, 18), 1);
  // Plus 2: gives a stroke back on the two easiest holes
  assert.equal(strokesReceived(-2, 18), -1);
  assert.equal(strokesReceived(-2, 17), -1);
  assert.equal(strokesReceived(-2, 16), 0);
});

test('stableford points', () => {
  assert.equal(stablefordPoints(4, 4, 0), 2); // par
  assert.equal(stablefordPoints(3, 4, 0), 3); // birdie
  assert.equal(stablefordPoints(2, 4, 0), 4); // eagle
  assert.equal(stablefordPoints(5, 4, 0), 1); // bogey
  assert.equal(stablefordPoints(6, 4, 0), 0); // double
  assert.equal(stablefordPoints(9, 4, 0), 0); // never negative
  assert.equal(stablefordPoints(5, 4, 1), 2); // net par with a stroke
});

function makeBestBallRound(
  strokesByPlayer: Record<string, (number | null)[]>,
  secondPlayerTiebreaker: boolean
): Round {
  const players: RoundPlayer[] = [
    { playerId: 'a1', name: 'A1', handicapIndex: 0, playingHandicap: 0, team: 'A' },
    { playerId: 'a2', name: 'A2', handicapIndex: 0, playingHandicap: 0, team: 'A' },
    { playerId: 'b1', name: 'B1', handicapIndex: 0, playingHandicap: 0, team: 'B' },
    { playerId: 'b2', name: 'B2', handicapIndex: 0, playingHandicap: 0, team: 'B' },
  ];
  return {
    id: 'r',
    startedAt: '2026-01-01',
    courseId: 'c',
    courseName: 'Test',
    teeId: 't',
    teeName: 'White',
    teeColor: '#fff',
    holes: holes18.slice(0, 3),
    players,
    game: 'bestBall',
    secondPlayerTiebreaker,
    strokes: strokesByPlayer,
    gamePoints: {},
    finished: false,
  };
}

test('best ball: best stableford wins the hole', () => {
  // Hole 1 (par 4, everyone off scratch):
  // A1 birdie (3pts) beats B's best par (2pts) → A wins
  const round = makeBestBallRound(
    {
      a1: [3, null, null],
      a2: [5, null, null],
      b1: [4, null, null],
      b2: [4, null, null],
    },
    false
  );
  const s = bestBallState(round);
  assert.equal(s.holeResults[0], 'A');
  assert.equal(s.diff, 1);
  assert.equal(matchStatusLabel(s.diff), 'Team A 1 UP');
});

test('best ball: drawn top scores halve the hole without tiebreaker', () => {
  // Best on each side pars (2pts each); seconds differ but tiebreaker is off
  const round = makeBestBallRound(
    {
      a1: [4, null, null],
      a2: [5, null, null],
      b1: [4, null, null],
      b2: [7, null, null],
    },
    false
  );
  const s = bestBallState(round);
  assert.equal(s.holeResults[0], 'draw');
  assert.equal(s.diff, 0);
  assert.equal(matchStatusLabel(s.diff), 'All Square');
});

test('best ball: second player decides drawn holes when tiebreaker is on', () => {
  const round = makeBestBallRound(
    {
      a1: [4, null, null],
      a2: [5, null, null], // A second: bogey, 1pt
      b1: [4, null, null],
      b2: [7, null, null], // B second: 0pts
    },
    true
  );
  const s = bestBallState(round);
  assert.equal(s.holeResults[0], 'A');
  assert.equal(s.diff, 1);
});

test('best ball: hole with missing scores has no result', () => {
  const round = makeBestBallRound(
    {
      a1: [4, 4, null],
      a2: [5, null, null],
      b1: [4, 4, null],
      b2: [7, 5, null],
    },
    true
  );
  const s = bestBallState(round);
  assert.equal(s.holeResults[1], null); // a2 hasn't scored hole 2
  assert.equal(s.holesDecided, 1);
});

test('best ball: running diff accumulates across holes', () => {
  // Hole 1: A wins (birdie vs par). Hole 2: B wins. Hole 3: halved.
  const round = makeBestBallRound(
    {
      a1: [3, 5, 4],
      a2: [5, 5, 5],
      b1: [4, 4, 4],
      b2: [4, 5, 5],
    },
    true
  );
  const s = bestBallState(round);
  assert.deepEqual(s.holeResults, ['A', 'B', 'draw']);
  assert.deepEqual(s.runningDiff, [1, 0, 0]);
  assert.equal(matchStatusLabel(s.diff), 'All Square');
});
