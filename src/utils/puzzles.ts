import { appDataDir, resolve } from "@tauri-apps/api/path";
import { commands, type PuzzleDatabaseInfo } from "@/bindings/generated";
import type { FileInfoMetadata, FileMetadata } from "@/features/files/utils/file";
import { logger } from "./logger";
import { unwrap } from "./unwrap";

// Removed import from "@/App" and replaced with direct Rust command to fetch the document directory

export const PUZZLE_DEBUG_LOGS = false;

export type Completion = "correct" | "incorrect" | "incomplete";

export interface Puzzle {
  fen: string;
  moves: string[];
  rating: number;
  rating_deviation: number;
  popularity: number;
  nb_plays: number;
  completion: Completion;
}

// Elo rating configuration
export const ELO_K_FACTOR = 40;
export const PROGRESSIVE_MIN_PROB = 0.4;
export const PROGRESSIVE_MAX_PROB = 0.6;

// Adaptive difficulty configuration
export const ADAPTIVE_CONSECUTIVE_FAILURES = 3;
export const ADAPTIVE_EASY_MIN_PROB = 0.6;
export const ADAPTIVE_EASY_MAX_PROB = 0.8;

// Helper functions to get data from different sections
async function getDatabasesFromDatabasesSection(): Promise<PuzzleDatabaseInfo[]> {
  const { readDir, BaseDirectory } = await import("@tauri-apps/plugin-fs");

  let dbPuzzles: PuzzleDatabaseInfo[] = [];

  // Get .db3 puzzle databases from AppData/db folder
  try {
    const files = await readDir("puzzles", { baseDir: BaseDirectory.AppData });
    const dbs = files.filter((file) => file.name?.endsWith(".db3"));
    dbPuzzles = (await Promise.allSettled(dbs.map((db) => getPuzzleDatabase(db.name))))
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<PuzzleDatabaseInfo>).value);

    if (PUZZLE_DEBUG_LOGS) {
      logger.debug(
        "Loaded puzzle databases:",
        dbPuzzles.map((db) => ({ title: db.title, puzzleCount: db.puzzleCount })),
      );
    }
  } catch (err) {
    logger.error("Error loading .db3 puzzles:", err);
  }

  return dbPuzzles;
}

async function getFilesFromFilesSection(): Promise<PuzzleDatabaseInfo[]> {
  const { readDir, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  const { processEntriesRecursively } = await import("@/features/files/utils/file");

  let localPuzzles: PuzzleDatabaseInfo[] = [];

  try {
    // FIX: Replaced App.tsx import with direct Tauri call to your Rust backend
    const dirsResult = await commands.loadDirectories();
    if (dirsResult.status === "error") {
      throw new Error(String(dirsResult.error));
    }
    const documentsDir = dirsResult.data.documentDir;

    const entries = await readDir(documentsDir, { baseDir: BaseDirectory.AppLocalData });
    const allEntries = await processEntriesRecursively(documentsDir, entries);

    // Get local .pgn puzzle files from document directory
    const puzzleFiles = allEntries.filter((file): file is FileMetadata => {
      if (file.type !== "file" || !file.path.endsWith(".pgn")) return false;
      const fileInfo = file.metadata as FileInfoMetadata;
      return fileInfo?.type === "puzzle";
    });

    // Convert puzzle files to database format
    localPuzzles = await Promise.all(
      puzzleFiles.map(async (file) => {
        const stats = unwrap(await commands.getFileMetadata(file.path));
        return {
          title: file.name.replace(".pgn", ""),
          description: "Custom puzzle collection",
          puzzleCount: unwrap(await commands.countPgnGames(file.path)),
          storageSize: BigInt(stats.size),
          path: file.path,
        };
      }),
    );
  } catch (err) {
    logger.error("Error loading local puzzles:", err);
  }

  return localPuzzles;
}

// Simple Elo-like rating calculations
export function expectedScore(playerRating: number, puzzleRating: number): number {
  return 1 / (1 + 10 ** ((puzzleRating - playerRating) / 400));
}

export function updateElo(
  playerRating: number,
  puzzleRating: number,
  solved: boolean,
  kFactor: number = ELO_K_FACTOR,
): number {
  const score = solved ? 1 : 0;
  const expected = expectedScore(playerRating, puzzleRating);
  const newRating = playerRating + kFactor * (score - expected);

  if (PUZZLE_DEBUG_LOGS) {
    logger.debug("Elo calculation:", {
      playerRating: Math.round(playerRating),
      puzzleRating,
      solved,
      kFactor,
      expected: expected.toFixed(3),
      score,
      newRating: Math.round(newRating),
      change: Math.round(newRating - playerRating),
    });
  }

  return Math.round(newRating);
}

export function getPuzzleRangeProb(
  playerRating: number,
  minProb: number = PROGRESSIVE_MIN_PROB,
  maxProb: number = PROGRESSIVE_MAX_PROB,
): [number, number] {
  const invertElo = (expected: number): number => {
    return playerRating + 400 * Math.log10(1 / expected - 1);
  };

  const lowerBound = invertElo(maxProb);
  const upperBound = invertElo(minProb);
  const range: [number, number] = [Math.round(lowerBound), Math.round(upperBound)];

  if (PUZZLE_DEBUG_LOGS) {
    logger.debug("Puzzle range calculation:", {
      playerRating,
      minProb,
      maxProb,
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
      range,
    });
  }

  return range;
}

export function getAdaptiveProbabilities(recentResults: Completion[]): [number, number] {
  const consecutiveFailures = recentResults.slice().reverse().indexOf("correct");
  const failureCount = consecutiveFailures === -1 ? recentResults.length : consecutiveFailures;

  let minProb = PROGRESSIVE_MIN_PROB;
  let maxProb = PROGRESSIVE_MAX_PROB;

  if (failureCount >= ADAPTIVE_CONSECUTIVE_FAILURES) {
    minProb = ADAPTIVE_EASY_MIN_PROB;
    maxProb = ADAPTIVE_EASY_MAX_PROB;
  }

  if (PUZZLE_DEBUG_LOGS) {
    logger.debug("Adaptive probabilities:", {
      recentResults,
      consecutiveFailures: failureCount,
      minProb,
      maxProb,
    });
  }

  return [minProb, maxProb];
}

export function getAdaptivePuzzleRange(playerRating: number, recentResults: Completion[]): [number, number] {
  const [minProb, maxProb] = getAdaptiveProbabilities(recentResults);
  return getPuzzleRangeProb(playerRating, minProb, maxProb);
}

async function getPuzzleDatabase(name: string): Promise<PuzzleDatabaseInfo> {
  const appDataDirPath = await appDataDir();
  const path = await resolve(appDataDirPath, "puzzles", name);
  return unwrap(await commands.getPuzzleDbInfo(path));
}

export async function getPuzzleDatabases(): Promise<PuzzleDatabaseInfo[]> {
  const dbPuzzles = await getDatabasesFromDatabasesSection();
  const localPuzzles = await getFilesFromFilesSection();
  return [...dbPuzzles, ...localPuzzles];
}