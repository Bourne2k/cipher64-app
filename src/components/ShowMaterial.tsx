import { memo } from "react";
import type { Color } from "@lichess-org/chessground/types";
import type { Role } from "chessops";
import Piece from "./Piece";
import { cn } from "@/lib/utils";

interface ShowMaterialProps {
    diff: number;
    pieces: Role[];
    color: Color;
}

function ShowMaterial({ diff, pieces, color }: ShowMaterialProps) {
    // If there's no material advantage and no pieces captured, render nothing
    if (diff === 0 && pieces.length === 0) return null;

    return (
        <div className="flex items-center ml-2 h-6 gap-0.5 opacity-90">
            {/* Captured Pieces */}
            <div className="flex items-center -space-x-1.5">
                {pieces.map((role, i) => (
                    <div key={`${role}-${i}`} className="w-4 h-4 sm:w-5 sm:h-5">
                        <Piece
                            piece={{
                                role,
                                color: color === "white" ? "black" : "white", // Captured pieces are the opposite color
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Material Advantage Score */}
            {diff > 0 && (
                <span className={cn(
                    "ml-1.5 text-[11px] font-bold font-mono",
                    color === "white" ? "text-foreground/70" : "text-foreground/70" // Can adjust colors based on theme if needed
                )}>
                    +{diff}
                </span>
            )}
        </div>
    );
}

export default memo(ShowMaterial);