import { memo, useContext, useEffect } from "react";
import { useStore } from "zustand";
import { useAtomValue } from "jotai";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Play,
    Square
} from "lucide-react"; // Replaced Tabler icons

import { TreeStateContext } from "./TreeStateContext";
import { keyMapAtom } from "@/state/keybindings";
import BoardControlsMenu from "./BoardControlsMenu";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MoveControlsProps {
    readOnly?: boolean;
    viewPawnStructure?: boolean;
    setViewPawnStructure?: (value: boolean) => void;
    takeSnapshot?: () => void;
    canTakeBack?: boolean;
    deleteMove?: () => void;
    changeTabType?: () => void;
    currentTabType?: "analysis" | "play";
    eraseDrawablesOnClick?: boolean;
    clearShapes?: () => void;
    disableVariations?: boolean;
    editingMode?: boolean;
    toggleEditingMode?: () => void;
    saveFile?: () => void;
    dirty?: boolean;
    autoSave?: boolean;
    reload?: () => void;
    addGame?: () => void;
    toggleOrientation?: () => void;
    currentTabSourceType?: string;
    startGame?: () => void;
    endGame?: () => void;
    gameState?: "settingUp" | "playing" | "gameOver";
    startGameDisabled?: boolean;
}

function MoveControls({
    readOnly,
    viewPawnStructure,
    setViewPawnStructure,
    takeSnapshot,
    canTakeBack,
    deleteMove: deleteMoveProp,
    changeTabType,
    currentTabType,
    eraseDrawablesOnClick,
    clearShapes,
    disableVariations,
    editingMode,
    toggleEditingMode,
    saveFile,
    reload,
    addGame,
    toggleOrientation,
    currentTabSourceType,
    startGame,
    endGame,
    gameState,
    startGameDisabled,
}: MoveControlsProps) {
    const store = useContext(TreeStateContext);
    if (!store) return null;

    const next = useStore(store, (s) => s.goToNext);
    const previous = useStore(store, (s) => s.goToPrevious);
    const start = useStore(store, (s) => s.goToStart);
    const end = useStore(store, (s) => s.goToEnd);
    const deleteMove = useStore(store, (s) => s.deleteMove);

    const startBranch = useStore(store, (s: any) => s.goToBranchStart);
    const endBranch = useStore(store, (s: any) => s.goToBranchEnd);
    const nextBranch = useStore(store, (s: any) => s.nextBranch);
    const previousBranch = useStore(store, (s: any) => s.previousBranch);
    const nextBranching = useStore(store, (s: any) => s.nextBranching);
    const previousBranching = useStore(store, (s: any) => s.previousBranching);

    const keyMap = useAtomValue(keyMapAtom);

    // Native hotkey replacement for Mantine's useHotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger hotkeys if the user is typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const checkKey = (mapping: any, action: () => void) => {
                if (mapping?.keys?.includes(e.key)) {
                    e.preventDefault();
                    action();
                }
            };

            checkKey(keyMap.PREVIOUS_MOVE, previous);
            checkKey(keyMap.NEXT_MOVE, next);
            checkKey(keyMap.GO_TO_START, start);
            checkKey(keyMap.GO_TO_END, end);
            checkKey(keyMap.DELETE_MOVE, readOnly ? () => { } : () => (deleteMoveProp || deleteMove)());
            checkKey(keyMap.GO_TO_BRANCH_START, startBranch);
            checkKey(keyMap.GO_TO_BRANCH_END, endBranch);
            checkKey(keyMap.NEXT_BRANCH, nextBranch);
            checkKey(keyMap.PREVIOUS_BRANCH, previousBranch);
            checkKey(keyMap.NEXT_BRANCHING, nextBranching);
            checkKey(keyMap.PREVIOUS_BRANCHING, previousBranching);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        keyMap, previous, next, start, end, readOnly, deleteMoveProp, deleteMove,
        startBranch, endBranch, nextBranch, previousBranch, nextBranching, previousBranching
    ]);

    const isPlaySetup = currentTabType === "play" && gameState === "settingUp";

    return (
        <div className="flex items-center w-full gap-1">
            <Button
                variant="outline"
                size="icon"
                className="flex-1 h-10 bg-card hover:bg-muted"
                onClick={start}
                disabled={isPlaySetup}
                title="Go to start"
            >
                <ChevronsLeft className="h-5 w-5 text-foreground/80" />
            </Button>

            <Button
                variant="outline"
                size="icon"
                className="flex-1 h-10 bg-card hover:bg-muted"
                onClick={previous}
                disabled={isPlaySetup}
                title="Previous move"
            >
                <ChevronLeft className="h-5 w-5 text-foreground/80" />
            </Button>

            {/* Dynamic Play/Stop button for active matches */}
            {currentTabType === "play" && (startGame || endGame) && (
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "flex-1 h-10 transition-colors",
                        gameState === "playing"
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/50"
                            : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/50"
                    )}
                    onClick={gameState === "playing" ? endGame : startGame}
                    disabled={gameState === "playing" ? false : startGameDisabled}
                >
                    {gameState === "playing" ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                </Button>
            )}

            <Button
                variant="outline"
                size="icon"
                className="flex-1 h-10 bg-card hover:bg-muted"
                onClick={next}
                disabled={isPlaySetup}
                title="Next move"
            >
                <ChevronRight className="h-5 w-5 text-foreground/80" />
            </Button>

            <Button
                variant="outline"
                size="icon"
                className="flex-1 h-10 bg-card hover:bg-muted"
                onClick={end}
                disabled={isPlaySetup}
                title="Go to end"
            >
                <ChevronsRight className="h-5 w-5 text-foreground/80" />
            </Button>

            {/* Board Settings & Actions Dropdown */}
            {!readOnly && (
                <div className="shrink-0 ml-1">
                    <BoardControlsMenu
                        viewPawnStructure={viewPawnStructure}
                        setViewPawnStructure={setViewPawnStructure}
                        takeSnapshot={takeSnapshot}
                        canTakeBack={canTakeBack}
                        deleteMove={deleteMoveProp}
                        changeTabType={changeTabType}
                        currentTabType={currentTabType}
                        eraseDrawablesOnClick={eraseDrawablesOnClick}
                        clearShapes={clearShapes}
                        disableVariations={disableVariations}
                        editingMode={editingMode}
                        toggleEditingMode={toggleEditingMode}
                        saveFile={saveFile}
                        reload={reload}
                        addGame={addGame}
                        toggleOrientation={toggleOrientation}
                        currentTabSourceType={currentTabSourceType}
                    />
                </div>
            )}
        </div>
    );
}

export default memo(MoveControls);