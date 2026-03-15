import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "zustand";

// Using strict relative paths to bypass any @ alias resolution issues
import ChallengeHistory from "../../../../components/ChallengeHistory";
import GameNotation from "../../../../components/GameNotation";
import MoveControls from "../../../../components/MoveControls";
import { TreeStateContext } from "../../../../components/TreeStateContext";

import { usePuzzleDatabase, usePuzzleSession } from "../../hooks";
import {
  hidePuzzleRatingAtom,
  inOrderPuzzlesAtom,
  jumpToNextPuzzleAtom,
  progressivePuzzlesAtom,
  puzzlePlayerRatingAtom,
} from "../../../../state/atoms";
import { positionFromFen } from "../../../../utils/chessops";
import { logger } from "../../../../utils/logger";
import { navigateToDatabasesWithModal } from "../../../../utils/navigation";
import { getAdaptivePuzzleRange, PUZZLE_DEBUG_LOGS } from "../../../../utils/puzzles";

import PuzzleBoard from "./PuzzleBoard";
import { PuzzleControls } from "./PuzzleControls";
import { PuzzleSettings } from "./PuzzleSettings";
import { PuzzleStatistics } from "./PuzzleStatistics";
import { ScrollArea } from "@/components/ui/scroll-area";

// Native replacement for Mantine's Portal to support react-mosaic mounts perfectly
function ReactPortal({ target, children }: { target: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  const el = document.querySelector(target);
  if (!el) return null;
  
  return createPortal(<div className="h-full">{children}</div>, el);
}

function Puzzles({ id }: { id: string }) {
  const navigate = useNavigate();
  const store = useContext(TreeStateContext);
  if (!store) throw new Error("TreeStateContext not found");
  const reset = useStore(store, (s) => s.reset);

  // Custom hooks for state management
  const {
    puzzleDbs,
    selectedDb,
    setSelectedDb,
    ratingRange,
    setRatingRange,
    dbRatingRange,
    minRating,
    maxRating,
    generatePuzzle: generatePuzzleFromDb,
    clearPuzzleCache,
  } = usePuzzleDatabase();

  const { puzzles, currentPuzzle, changeCompletion, addPuzzle, clearSession, selectPuzzle } = usePuzzleSession(id);

  // Local state
  const [progressive, setProgressive] = useAtom(progressivePuzzlesAtom);
  const [hideRating, setHideRating] = useAtom(hidePuzzleRatingAtom);
  const [inOrder, setInOrder] = useAtom(inOrderPuzzlesAtom);
  const [jumpToNext, setJumpToNext] = useAtom(jumpToNextPuzzleAtom);
  const [playerRating] = useAtom(puzzlePlayerRatingAtom);

  const [showingSolution, setShowingSolution] = useState(false);
  const isShowingSolutionRef = useRef<boolean>(false);

  const updateShowingSolution = (isShowing: boolean) => {
    setShowingSolution(isShowing);
    isShowingSolutionRef.current = isShowing;
  };

  // Computed values
  const currentPuzzleData = puzzles?.[currentPuzzle];
  const turnToMove = currentPuzzleData ? (positionFromFen(currentPuzzleData?.fen)[0]?.turn ?? null) : null;

  // Event handlers
  const handleGeneratePuzzle = async () => {
    if (!selectedDb) return;

    let range = ratingRange;
    if (progressive && minRating !== maxRating) {
      range = calculateProgressiveRange();
    }

    PUZZLE_DEBUG_LOGS &&
      logger.debug("Generating puzzle:", {
        db: selectedDb,
        range,
        progressive,
        inOrder,
        playerRating,
      });

    try {
      const puzzle = await generatePuzzleFromDb(selectedDb, range, inOrder);
      PUZZLE_DEBUG_LOGS &&
        logger.debug("Generated puzzle:", {
          fen: puzzle.fen,
          rating: puzzle.rating,
          moves: puzzle.moves,
        });
      addPuzzle(puzzle);
    } catch (error) {
      logger.error("Failed to generate puzzle:", error);
    }
  };

  const calculateProgressiveRange = (): [number, number] => {
    const completedResults = puzzles
      .filter((puzzle) => puzzle.completion !== "incomplete")
      .map((puzzle) => puzzle.completion)
      .slice(-10);

    const range = getAdaptivePuzzleRange(playerRating, completedResults);

    // Clamp to database bounds
    let [min, max] = range;
    min = Math.max(minRating, Math.min(min, maxRating));
    max = Math.max(minRating, Math.min(max, maxRating));

    PUZZLE_DEBUG_LOGS &&
      logger.debug("Adaptive range calculation:", {
        playerRating,
        recentResults: completedResults,
        originalRange: range,
        clampedRange: [min, max],
        dbBounds: [minRating, maxRating],
      });

    setRatingRange([min, max]);
    return [min, max];
  };

  const handleClearSession = () => {
    PUZZLE_DEBUG_LOGS && logger.debug("Clearing puzzle session");
    clearSession();
    if (selectedDb) {
      clearPuzzleCache(selectedDb);
    }
    reset();
  };

  const handleSelectPuzzle = (index: number) => {
    updateShowingSolution(false);
    selectPuzzle(index);
  };

  const handleDatabaseChange = (value: string | null) => {
    PUZZLE_DEBUG_LOGS && logger.debug("Database changed:", value);

    if (value === "add") {
      navigateToDatabasesWithModal(navigate, {
        tab: "puzzles",
        redirectTo: "/boards",
      });
    } else {
      setSelectedDb(value);
    }
  };

  return (
    <>
      <ReactPortal target="#left">
        <PuzzleBoard
          key={currentPuzzle}
          puzzles={puzzles}
          currentPuzzle={currentPuzzle}
          changeCompletion={changeCompletion}
          generatePuzzle={handleGeneratePuzzle}
          db={selectedDb}
          jumpToNext={jumpToNext}
        />
      </ReactPortal>

      <ReactPortal target="#topRight">
        {/* Replaces Paper and Divider */}
        <div className="h-full border border-border rounded-md bg-card text-card-foreground shadow-sm p-4 flex flex-col">
          <PuzzleSettings
            puzzleDbs={puzzleDbs}
            selectedDb={selectedDb}
            onDatabaseChange={handleDatabaseChange}
            ratingRange={ratingRange}
            onRatingRangeChange={setRatingRange}
            minRating={minRating}
            maxRating={maxRating}
            dbRatingRange={dbRatingRange}
            progressive={progressive}
            onProgressiveChange={setProgressive}
            hideRating={hideRating}
            onHideRatingChange={setHideRating}
            inOrder={inOrder}
            onInOrderChange={setInOrder}
          />
          
          <hr className="my-4 border-t border-border" />

          <PuzzleControls
            selectedDb={selectedDb}
            onGeneratePuzzle={handleGeneratePuzzle}
            onClearSession={handleClearSession}
            changeCompletion={changeCompletion}
            currentPuzzle={currentPuzzleData}
            puzzles={puzzles}
            jumpToNext={jumpToNext}
            onJumpToNextChange={setJumpToNext}
            turnToMove={turnToMove}
            showingSolution={showingSolution}
            updateShowingSolution={updateShowingSolution}
            isShowingSolutionRef={isShowingSolutionRef}
          />
          
          <hr className="my-4 border-t border-border" />

          <PuzzleStatistics currentPuzzle={currentPuzzleData} />
        </div>
      </ReactPortal>

      <ReactPortal target="#bottomRight">
        {/* Replaces Stack, Paper, and ScrollArea */}
        <div className="flex flex-col h-full gap-3">
          <div className="border border-border rounded-md bg-card text-card-foreground shadow-sm p-4 min-h-[5rem]">
            <ScrollArea className="h-full">
              <ChallengeHistory
                challenges={puzzles.map((p) => ({
                  ...p,
                  label: p.rating.toString(),
                }))}
                current={currentPuzzle}
                select={handleSelectPuzzle}
              />
            </ScrollArea>
          </div>
          
          <div className="flex flex-col flex-1 gap-3 overflow-hidden">
            <GameNotation initialVariationState="variations" />
            <MoveControls readOnly />
          </div>
        </div>
      </ReactPortal>
    </>
  );
}

export default Puzzles;