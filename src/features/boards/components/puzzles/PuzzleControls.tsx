import { useId, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useAtom, useSetAtom } from "jotai";
import { useStore } from "zustand";
import { Chess, parseUci } from "chessops";
import { parseFen } from "chessops/fen";

// Icons & UI
import { Plus, X, SearchCode } from "lucide-react"; // Replaced Tabler icons
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// State
import { TreeStateContext } from "@/components/TreeStateContext";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import type { Completion, Puzzle } from "@/utils/puzzles";
import { createTab } from "@/utils/tabs";
import { defaultTree } from "@/utils/treeReducer";

interface PuzzleControlsProps {
    selectedDb: string | null;
    onGeneratePuzzle: () => void;
    onClearSession: () => void;
    changeCompletion: (completion: Completion) => void;
    currentPuzzle?: Puzzle;
    puzzles: Puzzle[];
    jumpToNext: "off" | "success" | "success-and-failure";
    onJumpToNextChange: (value: "off" | "success" | "success-and-failure") => void;
    turnToMove: "white" | "black" | null;
    showingSolution: boolean;
    updateShowingSolution: (isShowing: boolean) => void;
    isShowingSolutionRef: React.RefObject<boolean>;
}

export const PuzzleControls = ({
    selectedDb,
    onGeneratePuzzle,
    onClearSession,
    changeCompletion,
    currentPuzzle,
    puzzles,
    jumpToNext,
    onJumpToNextChange,
    turnToMove,
    showingSolution,
    updateShowingSolution,
    isShowingSolutionRef,
}: PuzzleControlsProps) => {
    const { t } = useTranslation();
    const jumpToNextId = useId();

    const store = useContext(TreeStateContext)!;
    const goToStart = useStore(store, (s: any) => s.goToStart);
    const makeMove = useStore(store, (s: any) => s.makeMove);
    const reset = useStore(store, (s: any) => s.reset);

    const [, setTabs] = useAtom(tabsAtom);
    const setActiveTab = useSetAtom(activeTabAtom);

    const handleAnalyzePosition = () => {
        if (!currentPuzzle) return;
        const pos = Chess.fromSetup(parseFen(currentPuzzle.fen).unwrap()).unwrap();

        createTab({
            tab: { name: "Puzzle Analysis", type: "analysis" },
            setTabs,
            setActiveTab,
            pgn: currentPuzzle.moves.join(" "),
            headers: {
                ...defaultTree().headers,
                fen: currentPuzzle.fen,
                orientation: pos.turn === "white" ? "black" : "white",
            },
        });
    };

    const handleViewSolution = async () => {
        if (!currentPuzzle) return;
        changeCompletion("incorrect");

        updateShowingSolution(true);
        goToStart();

        for (let i = 0; i < currentPuzzle.moves.length; i++) {
            if (!isShowingSolutionRef.current) break;

            makeMove({
                payload: parseUci(currentPuzzle.moves[i])!,
                mainline: true,
            });
            await new Promise((r) => setTimeout(r, 500));
        }

        updateShowingSolution(false);
    };

    const handleGeneratePuzzle = () => {
        updateShowingSolution(false);
        onGeneratePuzzle();
    };

    const handleClearSession = () => {
        onClearSession();
        reset();
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-4">

                {/* Top Row: Automation & Actions */}
                <div className="flex items-center justify-between">

                    {/* Jump to Next Dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={jumpToNextId} className="text-[10px] uppercase font-bold text-muted-foreground">
                            {t("features.puzzle.jumpToNext", "Auto-Jump")}
                        </Label>
                        <Select
                            value={jumpToNext}
                            onValueChange={(v) => onJumpToNextChange(v as any)}
                        >
                            <SelectTrigger id={jumpToNextId} className="h-8 w-[140px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">{t("features.puzzle.jumpToNextOff", "Off")}</SelectItem>
                                <SelectItem value="success">{t("features.puzzle.jumpToNextOnSuccess", "On Success")}</SelectItem>
                                <SelectItem value="success-and-failure">{t("features.puzzle.jumpToNextOnSuccessAndFailure", "Always")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border/50">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" disabled={!selectedDb} onClick={handleGeneratePuzzle}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("features.puzzle.newPuzzle", "New Puzzle")}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-500 hover:bg-blue-500/10" disabled={!selectedDb} onClick={handleAnalyzePosition}>
                                    <SearchCode className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("features.puzzle.analyzePosition", "Analyze Position")}</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-4 bg-border mx-1" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleClearSession}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("features.puzzle.clearSession", "Clear Session")}</TooltipContent>
                        </Tooltip>
                    </div>

                </div>

                {/* Bottom Row: Solution & Turn Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="font-semibold shadow-sm"
                        onClick={handleViewSolution}
                        disabled={puzzles.length === 0 || showingSolution || turnToMove === null}
                    >
                        {showingSolution ? t("features.puzzle.showingSolution", "Showing Solution...") : t("features.puzzle.viewSolution", "View Solution")}
                    </Button>

                    {turnToMove && (
                        <span className="text-sm font-bold tracking-tight px-3 py-1 bg-muted rounded-md shadow-inner border border-border/50">
                            {turnToMove === "white" ? t("chess.fen.blackToMove", "Black to Move") : t("chess.fen.whiteToMove", "White to Move")}
                        </span>
                    )}
                </div>

            </div>
        </TooltipProvider>
    );
};