import type { Color, Piece as PieceType } from "@lichess-org/chessground/types";
import type { Role } from "chessops";
import { INITIAL_FEN } from "chessops/fen";
import { Trash2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import Piece from "@/components/Piece";
import { Button } from "@/components/ui/button";

interface PiecesGridProps {
    fen: string;
    boardRef: React.MutableRefObject<HTMLDivElement | null>;
    onPut: (newFen: string) => void;
    orientation: Color;
    selectedPiece: PieceType | null;
    setSelectedPiece: (piece: PieceType | null) => void;
}

const ROLES: Role[] = ["king", "queen", "rook", "bishop", "knight", "pawn"];

export default function PiecesGrid({
    boardRef,
    onPut,
    selectedPiece,
    setSelectedPiece,
}: PiecesGridProps) {
    const { t } = useTranslation();

    const handleSelect = (piece: PieceType, hasDragged: boolean) => {
        if (!hasDragged) {
            if (
                selectedPiece &&
                selectedPiece.role === piece.role &&
                selectedPiece.color === piece.color
            ) {
                setSelectedPiece(null);
            } else {
                setSelectedPiece(piece);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4">

            {/* Black Pieces Palette */}
            <div className="grid grid-cols-6 gap-1 bg-muted/30 p-2 rounded-md border border-border/50">
                {ROLES.map((role) => (
                    <div key={`black-${role}`} className="aspect-square w-full flex items-center justify-center cursor-pointer">
                        <Piece
                            piece={{ role, color: "black" }}
                            boardRef={boardRef}
                            selectedPiece={selectedPiece}
                            onSelect={handleSelect}
                        />
                    </div>
                ))}
            </div>

            {/* White Pieces Palette */}
            <div className="grid grid-cols-6 gap-1 bg-muted/30 p-2 rounded-md border border-border/50">
                {ROLES.map((role) => (
                    <div key={`white-${role}`} className="aspect-square w-full flex items-center justify-center cursor-pointer">
                        <Piece
                            piece={{ role, color: "white" }}
                            boardRef={boardRef}
                            selectedPiece={selectedPiece}
                            onSelect={handleSelect}
                        />
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
                <Button
                    variant="destructive"
                    className="flex-1 font-semibold text-xs h-9 shadow-sm"
                    onClick={() => {
                        onPut("8/8/8/8/8/8/8/8 w - - 0 1");
                        setSelectedPiece(null);
                    }}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("features.board.editor.clearBoard", "Clear")}
                </Button>

                <Button
                    variant="outline"
                    className="flex-1 font-semibold text-xs h-9 shadow-sm bg-card hover:bg-muted"
                    onClick={() => {
                        onPut(INITIAL_FEN);
                        setSelectedPiece(null);
                    }}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t("features.board.editor.initialPosition", "Reset")}
                </Button>
            </div>

        </div>
    );
}