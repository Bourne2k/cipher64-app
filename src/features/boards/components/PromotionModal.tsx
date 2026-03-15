import type { Color } from "@lichess-org/chessground/types";
import type { NormalMove, Role } from "chessops";
import { memo, useEffect, useRef } from "react";
import Piece from "@/components/Piece";
import { squareToCoordinates } from "@/utils/chessops";

// Custom hook to replace @mantine/hooks useClickOutside
function useClickOutside(handler: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handler]);
  return ref;
}

const PromotionModal = memo(function PromotionModal({
  pendingMove,
  cancelMove,
  confirmMove,
  turn,
  orientation,
}: {
  pendingMove: NormalMove | null;
  cancelMove: () => void;
  confirmMove: (p: Role) => void;
  turn: Color;
  orientation: Color;
}) {
  const ref = useClickOutside(() => cancelMove());

  if (!pendingMove) {
    return null;
  }
  const { file, rank } = squareToCoordinates(pendingMove.to, orientation);
  const promotionPieces: Role[] = ["queen", "knight", "rook", "bishop"];
  
  if ((turn === "black" && orientation === "white") || (turn === "white" && orientation === "black")) {
    promotionPieces.reverse();
  }

  return (
    <>
      {/* Dark Overlay */}
      <div className="absolute inset-0 z-[100] w-full h-full bg-black/50" />
      
      {/* Modal Container */}
      <div
        ref={ref}
        className="absolute z-[100] w-[12.5%] h-[50%] bg-white/80 dark:bg-black/80 rounded shadow-lg overflow-hidden flex flex-col"
        style={{
          left: `${(file - 1) * 12.5}%`,
          top: rank === 1 ? "50%" : "0%",
        }}
      >
        {promotionPieces.map((p) => (
          <button
            key={p}
            className="flex-1 w-full h-full p-0 m-0 border-none bg-transparent hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              confirmMove(p);
            }}
          >
            <Piece
              piece={{
                role: p,
                color: turn,
              }}
            />
          </button>
        ))}
      </div>
    </>
  );
});

export default PromotionModal;