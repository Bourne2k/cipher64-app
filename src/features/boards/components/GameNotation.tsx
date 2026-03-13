import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mapping the data structure from Pawn Appetit's treeReducer
interface MoveNode {
    san: string;
    fen: string;
}

export function GameNotation() {
    // Mocking the data extracted from TreeStateContext for the UI port
    // In production, wire this to: const mainLine = useStore(store, (s) => Array.from(treeIteratorMainLine(s.root)));
    const mockMoves: MoveNode[] = [
        { san: "e4", fen: "" }, { san: "e5", fen: "" },
        { san: "Nf3", fen: "" }, { san: "Nc6", fen: "" },
        { san: "Bc4", fen: "" }, { san: "Bc5", fen: "" },
        { san: "c3", fen: "" }, { san: "Nf6", fen: "" },
    ];

    const activeMoveIndex = 4; // Mock active node pointer

    // Helper to group flat moves into [White, Black] pairs
    const pairedMoves = [];
    for (let i = 0; i < mockMoves.length; i += 2) {
        pairedMoves.push({
            turn: Math.floor(i / 2) + 1,
            white: mockMoves[i],
            black: mockMoves[i + 1] || null,
            whiteIndex: i,
            blackIndex: i + 1,
        });
    }

    return (
        <div className="flex flex-col h-full bg-background border rounded-md overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 border-b flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Game Notation</span>
                <span>Italian Game</span>
            </div>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                    {pairedMoves.map((pair) => (
                        <div key={pair.turn} className="flex items-center text-sm rounded hover:bg-muted/50 transition-colors">
                            {/* Turn Number */}
                            <div className="w-12 text-center text-muted-foreground border-r py-1.5 select-none">
                                {pair.turn}.
                            </div>

                            {/* White Move */}
                            <div
                                className={cn(
                                    "flex-1 px-3 py-1.5 cursor-pointer font-mono text-center rounded-sm mx-1",
                                    activeMoveIndex === pair.whiteIndex
                                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                        : "hover:bg-muted"
                                )}
                            >
                                {pair.white.san}
                            </div>

                            {/* Black Move */}
                            <div
                                className={cn(
                                    "flex-1 px-3 py-1.5 cursor-pointer font-mono text-center rounded-sm mx-1",
                                    !pair.black ? "opacity-0" : "",
                                    activeMoveIndex === pair.blackIndex
                                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                        : "hover:bg-muted"
                                )}
                            >
                                {pair.black?.san || "..."}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}