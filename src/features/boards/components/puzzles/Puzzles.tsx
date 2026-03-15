import { useContext, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useStore } from "zustand";

// Core Components
import ChallengeHistory from "@/components/ChallengeHistory";
import { GameNotation } from "@/features/boards/components/GameNotation";
import { MoveControls } from "@/features/boards/components/MoveControls";
import { TreeStateContext } from "@/components/TreeStateContext";

// Hooks & State
import { usePuzzleDatabase, usePuzzleSession } from "@/features/boards/hooks";
import {
    hidePuzzleRatingAtom,
    inOrderPuzzlesAtom,
    jumpToNextPuzzleAtom,
    progressivePuzzlesAtom,
    puzzlePlayerRatingAtom,
} from "@/state/atoms";

// Utils
import { positionFromFen } from "@/utils/chessops";
import { logger } from "@/utils/logger";
import { navigateToDatabasesWithModal } from "@/utils/navigation";
import { getAdaptivePuzzleRange, PUZZLE_DEBUG_LOGS } from "@/utils/puzzles";

// Puzzle Sub-components
import PuzzleBoard from "./PuzzleBoard";
import { PuzzleControls } from "./PuzzleControls";
import { PuzzleSettings } from "./PuzzleSettings";
import { PuzzleStatistics } from "./PuzzleStatistics";

// Shadcn UI
import { ScrollArea } from "@/components/ui/scroll-area";

// --- CUSTOM NATIVE PORTAL COMPONENT ---
// Safely replaces Mantine's <Portal> for react-mosaic pane targeting
function DOMPortal({ children, targetId }: { children: React.ReactNode; targetId: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const element = document.getElementById(targetId);
    if (!element) return null;

    return createPortal(children, element);
}

export default function Puzzles({ id }: { id: string }) {
    const navigate = useNavigate();
    const store = useContext(TreeStateContext);
    if (!store) throw new Error("TreeStateContext not found");
    const reset = useStore(store, (s: any) => s.reset);

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

        if (PUZZLE_DEBUG_LOGS) {
            logger.debug("Generating puzzle:", { db: selectedDb, range, progressive, inOrder, playerRating });
        }

        try {
            const puzzle = await generatePuzzleFromDb(selectedDb, range, inOrder);
            if (PUZZLE_DEBUG_LOGS) {
                logger.debug("Generated puzzle:", { fen: puzzle.fen, rating: puzzle.rating, moves: puzzle.moves });
            }
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

        if (PUZZLE_DEBUG_LOGS) {
            logger.debug("Adaptive range calculation:", { playerRating, recentResults: completedResults, originalRange: range, clampedRange: [min, max], dbBounds: [minRating, maxRating] });
        }

        setRatingRange([min, max]);
        return [min, max];
    };

    const handleClearSession = () => {
        if (PUZZLE_DEBUG_LOGS) logger.debug("Clearing puzzle session");
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
        if (PUZZLE_DEBUG_LOGS) logger.debug("Database changed:", value);

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
            <DOMPortal targetId="left">
                <PuzzleBoard
                    key={currentPuzzle}
                    puzzles={puzzles}
                    currentPuzzle={currentPuzzle}
                    changeCompletion={changeCompletion}
                    generatePuzzle={handleGeneratePuzzle}
                    db={selectedDb}
                    jumpToNext={jumpToNext}
                />
            </DOMPortal>

            <DOMPortal targetId="topRight">
                <div className="flex flex-col h-full bg-card border-l border-b border-border/50 p-4 overflow-y-auto">
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

                    <hr className="my-4 border-border shrink-0" />

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

                    <hr className="my-4 border-border shrink-0" />

                    <PuzzleStatistics currentPuzzle={currentPuzzleData} />
                </div>
            </DOMPortal>

            <DOMPortal targetId="bottomRight">
                <div className="flex flex-col h-full gap-3 p-3 bg-muted/10 border-l border-border/50">

                    {/* Top Half: Challenge History */}
                    <div className="h-[200px] shrink-0 border border-border/50 bg-card rounded-md shadow-sm overflow-hidden flex flex-col p-3">
                        <ScrollArea className="flex-1 h-full pr-3">
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

                    {/* Bottom Half: Game Notation & Move Controls */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        <div className="flex-1 overflow-hidden rounded-md border border-border/50 shadow-sm bg-card">
                            {/* Pass initialVariationState or other props as needed by your ported GameNotation */}
                            <GameNotation />
                        </div>
                        <div className="shrink-0">
                            <MoveControls />
                        </div>
                    </div>

                </div>
            </DOMPortal>
        </>
    );
}