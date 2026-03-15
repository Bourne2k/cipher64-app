import { useState, useCallback } from "react";
import type { Puzzle, Completion } from "@/utils/puzzles";

export function usePuzzleSession(tabId: string) {
    // Read initial session from sessionStorage if needed, or default to empty
    const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
    const [currentPuzzle, setCurrentPuzzle] = useState<number>(0);

    const addPuzzle = useCallback((puzzle: Puzzle) => {
        setPuzzles((prev) => {
            const newPuzzles = [...prev, { ...puzzle, completion: "incomplete" as Completion }];
            setCurrentPuzzle(newPuzzles.length - 1);
            return newPuzzles;
        });
    }, []);

    const changeCompletion = useCallback((completion: Completion) => {
        setPuzzles((prev) => {
            const newPuzzles = [...prev];
            if (newPuzzles[currentPuzzle]) {
                newPuzzles[currentPuzzle] = { ...newPuzzles[currentPuzzle], completion };
            }
            return newPuzzles;
        });
    }, [currentPuzzle]);

    const clearSession = useCallback(() => {
        setPuzzles([]);
        setCurrentPuzzle(0);
    }, []);

    const selectPuzzle = useCallback((index: number) => {
        if (index >= 0 && index < puzzles.length) {
            setCurrentPuzzle(index);
        }
    }, [puzzles.length]);

    return {
        puzzles,
        currentPuzzle,
        addPuzzle,
        changeCompletion,
        clearSession,
        selectPuzzle,
    };
}