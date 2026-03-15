import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { hidePuzzleRatingAtom, maxPuzzlePlayerRatingAtom, puzzlePlayerRatingAtom } from "@/state/atoms";
import { logger } from "@/utils/logger";
import type { Puzzle } from "@/utils/puzzles";
import { PUZZLE_DEBUG_LOGS } from "@/utils/puzzles";

// Shadcn UI
import { Badge } from "@/components/ui/badge";

interface PuzzleStatisticsProps {
    currentPuzzle?: Puzzle;
}

export const PuzzleStatistics = ({ currentPuzzle }: PuzzleStatisticsProps) => {
    const { t } = useTranslation();
    const [hideRating] = useAtom(hidePuzzleRatingAtom);
    const [playerRating] = useAtom(puzzlePlayerRatingAtom);
    const [maxPlayerRating, setMaxPlayerRating] = useAtom(maxPuzzlePlayerRatingAtom);
    const [showNewMax, setShowNewMax] = useState(false);

    const displayRating = currentPuzzle?.completion === "incomplete" && hideRating ? "?" : currentPuzzle?.rating;

    // Check for new max rating
    useEffect(() => {
        if (playerRating > maxPlayerRating) {
            if (PUZZLE_DEBUG_LOGS) {
                logger.debug("New max rating achieved:", {
                    oldMax: Math.round(maxPlayerRating),
                    newMax: Math.round(playerRating),
                    improvement: Math.round(playerRating - maxPlayerRating),
                });
            }
            setMaxPlayerRating(playerRating);
            setShowNewMax(true);
            setTimeout(() => setShowNewMax(false), 5000);
        }
    }, [playerRating, maxPlayerRating, setMaxPlayerRating]);

    return (
        <div className="flex justify-between items-center w-full px-2">

            <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("features.puzzle.rating", "Puzzle")}
                </span>
                <span className="font-bold text-2xl tracking-tight mt-1">
                    {displayRating ? displayRating : "?"}
                </span>
            </div>

            <div className="flex flex-col items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("features.puzzle.playerRating", "Your Rating")}
                </span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-2xl tracking-tight text-primary">
                        {playerRating.toFixed(0)}
                    </span>
                    {showNewMax && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-transparent animate-in fade-in zoom-in duration-300">
                            {t("features.puzzle.newMax", "New Max")}!
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex flex-col text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("features.puzzle.maxRating", "Peak")}
                </span>
                <span className="font-bold text-2xl tracking-tight text-muted-foreground/80 mt-1">
                    {maxPlayerRating.toFixed(0)}
                </span>
            </div>

        </div>
    );
};