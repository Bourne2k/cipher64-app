import { memo } from "react";
import type { Color } from "@lichess-org/chessground/types";
import type { Role } from "chessops";
import Piece from "./Piece";
import { cn } from "@/lib/utils";

interface ShowMaterialProps {
  diff?: number;
  pieces?: Role[] | Record<string, number>;
  color: Color;
}

function ShowMaterial({ diff = 0, pieces, color }: ShowMaterialProps) {
  // Robust piece extraction: convert objects to arrays safely
  let piecesArray: Role[] = [];
  
  if (Array.isArray(pieces)) {
    piecesArray = pieces;
  } else if (pieces && typeof pieces === 'object') {
    Object.entries(pieces).forEach(([role, count]) => {
      for (let i = 0; i < (count as number); i++) {
        piecesArray.push(role as Role);
      }
    });
  }

  if (diff === 0 && piecesArray.length === 0) return null;

  return (
    <div className="flex items-center ml-2 h-6 gap-0.5 opacity-90">
      <div className="flex items-center -space-x-1.5">
        {piecesArray.map((role, i) => (
          <div key={`${role}-${i}`} className="w-4 h-4 sm:w-5 sm:h-5">
            <Piece
              piece={{
                role,
                color: color === "white" ? "black" : "white",
              }}
            />
          </div>
        ))}
      </div>
      {diff > 0 && (
        <span className={cn(
          "ml-1.5 text-[11px] font-bold font-mono",
          color === "white" ? "text-foreground/70" : "text-foreground/70" 
        )}>
          +{diff}
        </span>
      )}
    </div>
  );
}

export default memo(ShowMaterial);