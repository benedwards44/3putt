# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# 3putt

An on-device golf scoring app: courses, players, rounds, stableford and side games (Best Ball, Wolf, Sixes). Built with Expo SDK 57, React Native 0.86, expo-router (typed routes) and the React Compiler. There is no backend. All data lives in a persisted zustand store backed by AsyncStorage. See README.md for the feature list.

## Commands

```bash
npm install
npx tsc --noEmit                    # typecheck
npx expo lint                       # lint
node --test src/lib/golf.test.ts    # scoring engine tests (Node runs the .ts file directly)
npx expo run:ios --device           # build and install on a cabled iPhone (needs Xcode)
```

- `ios/` and `android/` are generated and gitignored, so never edit them by hand. Native config belongs in `app.json` or a config plugin in `plugins/`.
- iOS signing: bundle ID `com.benedwards44.3putt`, Apple team ID set in `app.json`.

## Layout

- `src/lib/golf.ts`: all scoring math (playing handicap, stroke allocation, stableford, totals, the Best Ball match engine). Keep it pure, and use only `import type` with relative paths (no `@/` alias). That way the Node test runner can load it without a bundler.
- `src/store/useStore.ts`: the single persisted store, holding courses, players, rounds and all their actions.
- `src/types/index.ts`: the domain types.
- `src/app/`: screens. `(tabs)/` holds Rounds (`index`), Courses and Players. `course/new` and `round/new` are modals. `course/[id]` edits a course, and `round/[id]` is the live round, with score entry and a leaderboard.
- `src/components/`: `course-form`, `round-score`, `round-leaderboard`, and the shared UI kit in `ui/index.tsx` (`Screen`, `Card`, `Button` with a `danger` variant, `Segmented`, `TextField`, `EmptyState`, `Badge`, `Chip`, …).
- Theming: get colours from `useTheme()` and spacing and radii from `@/constants/theme`. Don't hard-code colours. Light and dark mode both need to work.

## Domain rules

- **Handicaps:** players always enter their normal 18-hole Handicap Index. A plus handicap is typed as `+2` and stored as a negative number (see `formatHandicap`). The playing handicap is `index × (slope ÷ 113) + (rating − par)`, rounded to the nearest whole number. On 9-hole courses the index is halved first (WHS rule), and the course rating and par are the 9-hole values.
- **Course rating limits** in the course form: 50–90 for 18 holes, 25–45 for 9 holes.
- **Stroke index** runs from 1 to the number of holes, and must be unique within a course.
- **Rounds are snapshots:** a round copies the course name, tee, holes and players, and computes each player's `playingHandicap` once, when the round is created. Editing or deleting a course or player later doesn't change existing rounds, and screens must never look up a round's course or players from the store.
- **Deleting:** rounds, courses and players can each be deleted with a confirm prompt. Long-pressing an item in its list works too, alongside the visible delete buttons on the round, course and player screens.

## Gotchas

- The persisted store has no `version` or `migrate`. If you change the shape of stored data, add a `version` and `migrate` to the `persist` options so users' saved data still loads.
- Stack screens use `headerBackTitle: 'Back'`, set in `src/app/_layout.tsx`. Without it, iOS labels the back button "(tabs)".
- Add a test to `golf.test.ts` for any change to the scoring rules.
