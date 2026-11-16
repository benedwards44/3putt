export interface HoleInfo {
  /** 1-based hole number */
  number: number;
  par: number;
  /** Stroke index 1..18 — 1 is the hardest hole */
  strokeIndex: number;
}

export interface Tee {
  id: string;
  /** e.g. Blue, White, Red */
  name: string;
  /** Swatch colour used in the UI */
  color: string;
  courseRating: number;
  slopeRating: number;
}

export interface Course {
  id: string;
  name: string;
  holes: HoleInfo[];
  tees: Tee[];
}

export interface Player {
  id: string;
  name: string;
  handicapIndex: number;
}

export type GameType = 'none' | 'bestBall' | 'wolf' | 'sixes';

export type TeamId = 'A' | 'B';

export interface RoundPlayer {
  playerId: string;
  name: string;
  handicapIndex: number;
  /** Course/playing handicap computed for this round */
  playingHandicap: number;
  /** Only set for Best Ball */
  team?: TeamId;
  /**
   * The tee this player plays from. Missing on rounds saved before per-player
   * tees existed — fall back to the round's tee (see `playerTee` in lib/golf).
   */
  teeId?: string;
  teeName?: string;
  teeColor?: string;
}

export interface Round {
  id: string;
  /** ISO date string */
  startedAt: string;
  courseId: string;
  courseName: string;
  /** Default tee for the round; individual players may play from other tees */
  teeId: string;
  teeName: string;
  teeColor: string;
  /** Snapshot of the course holes at the time the round started */
  holes: HoleInfo[];
  players: RoundPlayer[];
  game: GameType;
  /** Best Ball option: settle drawn holes on the second player's score */
  secondPlayerTiebreaker: boolean;
  /** playerId -> gross strokes per hole (null = not entered yet) */
  strokes: Record<string, (number | null)[]>;
  /** playerId -> manually awarded game points per hole (Wolf / Sixes) */
  gamePoints: Record<string, (number | null)[]>;
  finished: boolean;
}

export const GAME_LABELS: Record<GameType, string> = {
  none: 'Strokes & Stableford',
  bestBall: 'Best Ball',
  wolf: 'Wolf',
  sixes: 'Sixes',
};
