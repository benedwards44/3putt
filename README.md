# 3putt

A mobile app for scoring golf games with friends — strokes, stableford and side games — built with Expo and React Native for iOS and Android.

## Features

- **Courses** — save courses for reuse: 9 or 18 holes, par and stroke index per hole, and multiple tees (Blue, White, Red, …) each with its own course rating and slope.
- **Players** — save your regular group with their handicap index (plus handicaps supported as `+2`).
- **Rounds** — pick a course, tee and players. Playing handicaps are calculated automatically with the WHS formula: `index × (slope ÷ 113) + (rating − par)`.
- **Score entry** — one simple screen per hole. Enter each player's strokes and their stableford points appear instantly (handicap strokes are allocated by stroke index).
- **Games** — every round scores strokes and stableford; optionally add:
  - **Best Ball** — 2 v 2 match play. Each hole goes to the team whose best player scored the most stableford points, with an optional *second player tiebreaker* for drawn holes. Live match status (e.g. "Ben & Sam 2 UP").
  - **Wolf** — award each player 0–6 points per hole, cumulative total.
  - **Sixes** — same 0–6 points per hole, cumulative total.
- **Live leaderboard** — switch between score entry and the leaderboard mid-round: gross strokes, score to par, stableford points, holes played, and game standings.

Everything is stored on-device (AsyncStorage) — no account or connection needed.

## Running

```bash
npm install
npx expo start        # then press i for iOS simulator, a for Android
```

## Development

```bash
npx tsc --noEmit                      # typecheck
npx expo lint                         # lint
node --test src/lib/golf.test.ts      # scoring engine unit tests
```

### Structure

- `src/lib/golf.ts` — all scoring math: playing handicap, stroke allocation, stableford, Best Ball match engine
- `src/store/useStore.ts` — persisted zustand store (courses, players, rounds)
- `src/app/` — expo-router screens: tabs (Rounds / Courses / Players), course editor, round setup, live round
- `src/components/` — course form, score entry, leaderboard, shared UI kit
