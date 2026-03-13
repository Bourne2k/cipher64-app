import { useMemo } from 'react';
import { parseFen } from 'chessops/fen';
import { makePiece } from 'chessops/util';
import { Badge } from '@/components/ui/badge';

interface CapturedPiecesProps {
    fen: string;
    color: 'white' | 'black'; // The color of the player whose captures we are showing
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const STARTING_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };

export function CapturedPieces({ fen, color }: CapturedPiecesProps) {
    const diff = useMemo(() => {
        const setup = parseFen(fen).unwrap();
        const currentCounts = { p: 0, n: 0, b: 0, r: 0, q: 0, P: 0, N: 0, B: 0, R: 0, Q: 0 };

        // Count pieces on board
        for (let i = 0; i < 64; i++) {
            const piece = setup.board.get(i);
            if (piece) {
                const char = piece.color === 'white' ? piece.role.toUpperCase() : piece.role;
                if (currentCounts[char as keyof typeof currentCounts] !== undefined) {
                    currentCounts[char as keyof typeof currentCounts]++;
                }
            }
        }

        // Calculate what is missing (captured)
        const capturedByWhite = [];
        const capturedByBlack = [];
        let whiteScore = 0;
        let blackScore = 0;

        for (const [role, startCount] of Object.entries(STARTING_COUNT)) {
            // Black pieces missing (captured by White)
            const blackMissing = startCount - currentCounts[role as keyof typeof currentCounts];
            for (let i = 0; i < blackMissing; i++) {
                capturedByWhite.push(role);
                whiteScore += PIECE_VALUES[role];
            }

            // White pieces missing (captured by Black)
            const whiteMissing = startCount - currentCounts[role.toUpperCase() as keyof typeof currentCounts];
            for (let i = 0; i < whiteMissing; i++) {
                capturedByBlack.push(role);
                blackScore += PIECE_VALUES[role];
            }
        }

        // Sort conventionally: Q, R, B, N, P
        const sortOrder = ['q', 'r', 'b', 'n', 'p'];
        capturedByWhite.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
        capturedByBlack.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));

        const materialDiff = whiteScore - blackScore;

        return {
            pieces: color === 'white' ? capturedByWhite : capturedByBlack,
            score: color === 'white' ? materialDiff : -materialDiff,
        };
    }, [fen, color]);

    if (diff.pieces.length === 0 && diff.score <= 0) return <div className="h-6" />; // Keep layout height

    return (
        <div className="flex items-center gap-2 h-6">
            <div className="flex gap-0.5">
                {diff.pieces.map((p, i) => (
                    // In a real app, map this to an SVG icon. Using text fallback for now.
                    <span key={i} className="text-lg leading-none opacity-80 font-chess">
                        {color === 'white' ? p : p.toUpperCase()}
                    </span>
                ))}
            </div>
            {diff.score > 0 && (
                <Badge variant="secondary" className="px-1.5 text-xs font-mono h-5 bg-muted/50 text-muted-foreground">
                    +{diff.score}
                </Badge>
            )}
        </div>
    );
}