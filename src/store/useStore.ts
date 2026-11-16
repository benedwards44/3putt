import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { playingHandicap } from '@/lib/golf';
import { makeId } from '@/lib/id';
import type { Course, GameType, Player, Round, TeamId } from '@/types';

export interface NewRoundInput {
  course: Course;
  /** Default tee for the round */
  teeId: string;
  playerIds: string[];
  /** playerId -> teeId, for players not on the default tee */
  playerTees: Record<string, string>;
  game: GameType;
  secondPlayerTiebreaker: boolean;
  /** playerId -> team, required for Best Ball */
  teams: Record<string, TeamId>;
}

interface AppState {
  courses: Course[];
  players: Player[];
  rounds: Round[];

  addCourse: (course: Omit<Course, 'id'>) => string;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;

  addPlayer: (player: Omit<Player, 'id'>) => string;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;

  createRound: (input: NewRoundInput) => string;
  setStroke: (roundId: string, playerId: string, holeIdx: number, strokes: number | null) => void;
  setGamePoints: (roundId: string, playerId: string, holeIdx: number, points: number | null) => void;
  setFinished: (roundId: string, finished: boolean) => void;
  deleteRound: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      courses: [],
      players: [],
      rounds: [],

      addCourse: (course) => {
        const id = makeId();
        set((s) => ({ courses: [...s.courses, { ...course, id }] }));
        return id;
      },
      updateCourse: (course) =>
        set((s) => ({ courses: s.courses.map((c) => (c.id === course.id ? course : c)) })),
      deleteCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),

      addPlayer: (player) => {
        const id = makeId();
        set((s) => ({ players: [...s.players, { ...player, id }] }));
        return id;
      },
      updatePlayer: (player) =>
        set((s) => ({ players: s.players.map((p) => (p.id === player.id ? player : p)) })),
      deletePlayer: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      createRound: (input) => {
        const { course, teeId, playerIds, playerTees, game, secondPlayerTiebreaker, teams } = input;
        const tee = course.tees.find((t) => t.id === teeId)!;
        const teeFor = (pid: string) => course.tees.find((t) => t.id === playerTees[pid]) ?? tee;
        const id = makeId();
        const players = playerIds.map((pid) => {
          const p = get().players.find((pl) => pl.id === pid)!;
          const playerTee = teeFor(pid);
          return {
            playerId: p.id,
            name: p.name,
            handicapIndex: p.handicapIndex,
            playingHandicap: playingHandicap(p.handicapIndex, playerTee, course.holes),
            team: game === 'bestBall' ? teams[pid] : undefined,
            teeId: playerTee.id,
            teeName: playerTee.name,
            teeColor: playerTee.color,
          };
        });
        const emptyScores = () =>
          Object.fromEntries(playerIds.map((pid) => [pid, course.holes.map(() => null)]));
        const round: Round = {
          id,
          startedAt: new Date().toISOString(),
          courseId: course.id,
          courseName: course.name,
          teeId: tee.id,
          teeName: tee.name,
          teeColor: tee.color,
          holes: course.holes.map((h) => ({ ...h })),
          players,
          game,
          secondPlayerTiebreaker,
          strokes: emptyScores(),
          gamePoints: emptyScores(),
          finished: false,
        };
        set((s) => ({ rounds: [round, ...s.rounds] }));
        return id;
      },

      setStroke: (roundId, playerId, holeIdx, strokes) =>
        set((s) => ({
          rounds: s.rounds.map((r) => {
            if (r.id !== roundId) return r;
            const arr = [...(r.strokes[playerId] ?? r.holes.map(() => null))];
            arr[holeIdx] = strokes;
            return { ...r, strokes: { ...r.strokes, [playerId]: arr } };
          }),
        })),

      setGamePoints: (roundId, playerId, holeIdx, points) =>
        set((s) => ({
          rounds: s.rounds.map((r) => {
            if (r.id !== roundId) return r;
            const arr = [...(r.gamePoints[playerId] ?? r.holes.map(() => null))];
            arr[holeIdx] = points;
            return { ...r, gamePoints: { ...r.gamePoints, [playerId]: arr } };
          }),
        })),

      setFinished: (roundId, finished) =>
        set((s) => ({ rounds: s.rounds.map((r) => (r.id === roundId ? { ...r, finished } : r)) })),

      deleteRound: (id) => set((s) => ({ rounds: s.rounds.filter((r) => r.id !== id) })),
    }),
    {
      name: '3putt-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
