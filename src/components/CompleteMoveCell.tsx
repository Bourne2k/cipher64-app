import { useContext } from "react";
import equal from "fast-deep-equal";
import { useStore } from "zustand";
import { match } from "ts-pattern";
import { MessageSquareText } from "lucide-react";

import { TreeStateContext } from "@/components/TreeStateContext";
import { cn } from "@/lib/utils";

interface CompleteMoveCellProps {
    move: string;
    halfMoves: number;
    comment?: string;
    annotations: string[];
    fen: string;
    targetRef?: React.Ref<HTMLSpanElement>;
    movePath?: number[];
    showComments?: boolean;
    isStart?: boolean;
    first?: boolean;
}

export default function CompleteMoveCell({
    move,
    halfMoves,
    comment,
    annotations,
    fen,
    targetRef,
    movePath,
    showComments = true,
    isStart = false,
    first = false,
}: CompleteMoveCellProps) {
    const store = useContext(TreeStateContext);
    if (!store) return null;

    const currentPath = useStore(store, (s) => s.position);
    const goToMove = useStore(store, (s) => s.goToMove);

    const isCurrent = equal(currentPath, movePath);
    const moveNumber = Math.floor((halfMoves - 1) / 2) + 1;
    const isWhite = halfMoves % 2 !== 0;

    const annotationColor = match(annotations[0])
        .with("!", "!!", () => "text-emerald-500")
        .with("?", "??", () => "text-red-500")
        .with("!?", "?!", () => "text-amber-500")
        .with("□", () => "text-blue-500")
        .otherwise(() => "text-muted-foreground");

    return (
        <span
            ref={isCurrent ? targetRef : undefined}
            className={cn(
                "inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded cursor-pointer select-none transition-colors",
                isCurrent
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "hover:bg-muted font-medium text-foreground/90"
            )}
            onClick={() => movePath && goToMove(movePath)}
        >
            {/* Display Move Number */}
            {(isWhite || isStart || first) && (
                <span className={cn("mr-1 text-xs opacity-70", isCurrent ? "text-primary-foreground" : "text-muted-foreground")}>
                    {moveNumber}{isWhite ? "." : "..."}
                </span>
            )}

            {/* Display SAN */}
            <span className="text-[13px]">{move}</span>

            {/* Display Annotations (!, ?, etc) */}
            {annotations.length > 0 && (
                <span className={cn("ml-0.5 font-bold", isCurrent ? "text-primary-foreground" : annotationColor)}>
                    {annotations.join("")}
                </span>
            )}

            {/* Display Comment Indicator */}
            {comment && showComments && (
                <MessageSquareText className={cn("ml-1 w-3 h-3", isCurrent ? "text-primary-foreground/80" : "text-blue-500/70")} />
            )}
        </span>
    );
}