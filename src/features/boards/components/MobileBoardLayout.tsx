import { memo, useContext, useState } from "react";
import { useStore } from "zustand";
import { makeSquare, parseSquare, type NormalMove } from "chessops";
import { chessgroundDests, chessgroundMove } from "chessops/compat";

import { TreeStateContext } from "@/components/TreeStateContext";
import { positionFromFen } from "@/utils/chessops";
import { Chessground } from "@/components/Chessground";

import EvalBar from "./EvalBar";
import PromotionModal from "./PromotionModal";
import AnnotationHint from "./AnnotationHint";

import { useAtomValue, useSetAtom } from "jotai";
import {
    autoPromoteAtom,
    blindfoldAtom,
    showCoordinatesAtom,
    showDestsAtom,
} from "@/state/atoms";

// Notice we accept the same massive props interface from ResponsiveBoard
function MobileBoardLayout(props: any) {
    const store = useContext(TreeStateContext);
    if (!store) return null;

    const rootFen = useStore(store, (s) => s.root.fen);
    const headers = useStore(store, (s) => s.headers);
    const currentNode = useStore(store, (s) => s.currentNode());
    const storeMakeMove = useStore(store, (s) => s.makeMove);

    const [pos] = positionFromFen(currentNode.fen);
    const [pendingMove, setPendingMove] = useState<NormalMove | null>(null);

    const showDests = useAtomValue(showDestsAtom);
    const autoPromote = useAtomValue(autoPromoteAtom);
    const showCoordinates = useAtomValue(showCoordinatesAtom);
    const isBlindfold = useAtomValue(blindfoldAtom);

    const turn = pos?.turn || "white";
    const orientation = headers.orientation || "white";

    const dests = pos ? chessgroundDests(pos) : new Map();

    const square = currentNode.move ? currentNode.move.to : undefined;
    const lastMove = currentNode.move && square !== undefined
        ? [chessgroundMove(currentNode.move)[0], makeSquare(square)!]
        : undefined;

    function makeMove(move: NormalMove) {
        if (!pos) return;
        storeMakeMove({ payload: move, clock: pos.turn === "white" ? props.whiteTime : props.blackTime });
        setPendingMove(null);
    }

    return (
        <div className="flex flex-col w-full h-full gap-2 px-2">

            {/* Top Player Info / Clock Space */}
            <div className="h-8 shrink-0 flex items-center justify-between px-1">
                {/* Add opponent clock/info here if needed */}
            </div>

            {/* Main Board Area */}
            <div className="w-full aspect-square relative flex items-stretch">

                {/* Vertical Eval Bar for Mobile */}
                <div className="w-[16px] shrink-0 mr-2 rounded-sm overflow-hidden border border-border/50">
                    <EvalBar score={currentNode.score?.value || null} orientation={orientation} />
                </div>

                {/* The Board */}
                <div className={`flex-1 relative shadow-lg ring-1 ring-border/50 rounded-sm overflow-hidden ${isBlindfold ? "[&_piece]:opacity-0" : ""}`}>

                    {currentNode.annotations.length > 0 && square !== undefined && (
                        <AnnotationHint orientation={orientation} square={square} annotation={currentNode.annotations[0]} />
                    )}

                    <PromotionModal
                        pendingMove={pendingMove}
                        cancelMove={() => setPendingMove(null)}
                        confirmMove={(p) => { if (pendingMove) makeMove({ ...pendingMove, promotion: p }); }}
                        turn={turn}
                        orientation={orientation}
                    />

                    <Chessground
                        orientation={orientation}
                        fen={currentNode.fen}
                        animation={{ enabled: !props.editingMode }}
                        coordinates={showCoordinates !== "none"}
                        coordinatesOnSquares={showCoordinates === "all"}
                        movable={{
                            free: props.editingMode,
                            color: props.editingMode ? "both" : turn,
                            dests: props.editingMode || props.viewOnly ? undefined : dests,
                            showDests,
                            events: {
                                after(orig, dest) {
                                    if (!props.editingMode) {
                                        const from = parseSquare(orig)!;
                                        const to = parseSquare(dest)!;
                                        if (pos) {
                                            if (pos.board.get(from)?.role === "pawn" && ((dest[1] === "8" && turn === "white") || (dest[1] === "1" && turn === "black"))) {
                                                if (autoPromote) { makeMove({ from, to, promotion: "queen" }); }
                                                else { setPendingMove({ from, to }); }
                                            } else { makeMove({ from, to }); }
                                        }
                                    }
                                },
                            },
                        }}
                        turnColor={turn}
                        check={pos?.isCheck()}
                        lastMove={props.editingMode ? undefined : lastMove}
                    />
                </div>
            </div>

            {/* Bottom Player Info / Clock Space */}
            <div className="h-8 shrink-0 flex items-center justify-between px-1 mt-1">
                {/* Add active player clock/info here if needed */}
            </div>

        </div>
    );
}

export default memo(MobileBoardLayout);