import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Dummy data to test the UI before we hook up your Jotai state
const DUMMY_MOVES = [
    { w: 'e4', b: 'e5' },
    { w: 'Nf3', b: 'Nc6' },
    { w: 'Bc4', b: 'Nf6', bEval: '-0.4', isMistake: true },
    { w: 'Ng5', b: 'd5' },
    { w: 'exd5', b: 'Na5' },
];

export function GameNotation() {
    return (
        <ScrollArea className="flex-1 rounded-md border border-border bg-card">
            <div className="flex flex-col text-sm font-medium">

                {/* Notation Header */}
                <div className="grid grid-cols-[3rem_1fr_1fr] border-b border-border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                    <div className="text-center">#</div>
                    <div>White</div>
                    <div>Black</div>
                </div>

                {/* Moves List */}
                <div className="flex flex-col p-1">
                    {DUMMY_MOVES.map((move, index) => (
                        <div
                            key={index}
                            className={cn(
                                "grid grid-cols-[3rem_1fr_1fr] items-center rounded-sm px-2 py-1 hover:bg-muted/50 cursor-pointer",
                                index % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                            )}
                        >
                            <div className="text-center text-muted-foreground">{index + 1}.</div>

                            {/* White Move */}
                            <div className="flex items-center gap-2">
                                <span className="font-mono">{move.w}</span>
                            </div>

                            {/* Black Move */}
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-mono px-1 rounded-sm transition-colors",
                                    move.isMistake ? "bg-destructive/20 text-destructive font-bold" : ""
                                )}>
                                    {move.b}
                                </span>
                                {move.bEval && (
                                    <span className="text-[10px] text-muted-foreground">{move.bEval}</span>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}