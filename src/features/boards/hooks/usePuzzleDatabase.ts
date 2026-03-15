import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { commands, type PuzzleDatabaseInfo } from "@/bindings/generated";
import { getPuzzleDatabases } from "@/utils/puzzles";
import { unwrap } from "@/utils/unwrap";

export function usePuzzleDatabase() {
    const [puzzleDbs, setPuzzleDbs] = useState<PuzzleDatabaseInfo[]>([]);
    const [selectedDb, setSelectedDb] = useState<string | null>(null);
    const [ratingRange, setRatingRange] = useState<[number, number]>([0, 3000]);
    const [dbRatingRange, setDbRatingRange] = useState<[number, number] | null>(null);
    const [minRating, setMinRating] = useState(0);
    const [maxRating, setMaxRating] = useState(3000);

    useEffect(() => {
        getPuzzleDatabases().then((dbs) => {
            setPuzzleDbs(dbs);
            if (dbs.length > 0 && !selectedDb) {
                setSelectedDb(dbs[0].path);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedDb) {
            commands.getPuzzleDbInfo(selectedDb)
                .then((result) => {
                    const info = unwrap(result);
                    setMinRating(info.minRating);
                    setMaxRating(info.maxRating);
                    setDbRatingRange([info.minRating, info.maxRating]);
                    setRatingRange([info.minRating, info.maxRating]);
                })
                .catch((err) => {
                    console.error("Failed to fetch puzzle db info:", err);
                    toast.error("Failed to load puzzle database information.");
                });
        }
    }, [selectedDb]);

    const generatePuzzle = useCallback(async (db: string, range?: [number, number], inOrder?: boolean) => {
        try {
            const actualRange = range || ratingRange;
            const result = await commands.getRandomPuzzle(db, actualRange[0], actualRange[1], inOrder || false);
            return unwrap(result);
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate puzzle.");
            throw err;
        }
    }, [ratingRange]);

    const clearPuzzleCache = useCallback(async (db: string) => {
        try {
            await commands.clearPuzzleCache(db);
        } catch (err) {
            console.error(err);
        }
    }, []);

    return {
        puzzleDbs,
        selectedDb,
        setSelectedDb,
        ratingRange,
        setRatingRange,
        dbRatingRange,
        minRating,
        maxRating,
        generatePuzzle,
        clearPuzzleCache,
    };
}