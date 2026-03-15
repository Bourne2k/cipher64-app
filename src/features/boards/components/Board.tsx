import type { DrawShape } from "@lichess-org/chessground/draw";
import type { Piece } from "@lichess-org/chessground/types";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { makeSquare, type NormalMove, parseSquare, parseUci, type SquareName } from "chessops";
import { chessgroundDests, chessgroundMove } from "chessops/compat";
import { makeSan } from "chessops/san";
import domtoimage from "dom-to-image";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner"; // Replaced Mantine notifications

import BoardControlsMenu from "@/components/BoardControlsMenu";
import { Chessground } from "@/components/Chessground";
import Clock from "@/components/Clock";
import MoveControls from "@/components/MoveControls";
import { arrowColors } from "@/components/panels/analysis/BestMoves";
import ShowMaterial from "@/components/ShowMaterial";
import { TreeStateContext } from "@/components/TreeStateContext";
import { updateCardPerformance } from "@/features/files/utils/opening";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
    autoPromoteAtom,
    bestMovesFamily,
    blindfoldAtom,
    currentEvalOpenAtom,
    currentTabAtom,
    deckAtomFamily,
    enableBoardScrollAtom,
    eraseDrawablesOnClickAtom,
    moveInputAtom,
    showArrowsAtom,
    showConsecutiveArrowsAtom,
    showCoordinatesAtom,
    showDestsAtom,
    snapArrowsAtom,
} from "@/state/atoms";
import { keyMapAtom } from "@/state/keybindings";
import { annotationColors, isBasicAnnotation } from "@/utils/annotation";
import { getMaterialDiff, getVariationLine } from "@/utils/chess";
import { chessopsError, positionFromFen } from "@/utils/chessops";
import { getDocumentDir } from "@/utils/documentDir";
import AnnotationHint from "./AnnotationHint";
import EvalBar from "./EvalBar";
import MoveInput from "./MoveInput";
import PromotionModal from "./PromotionModal";

const LARGE_BRUSH = 11;
const MEDIUM_BRUSH = 7.5;
const SMALL_BRUSH = 4;

interface ChessboardProps {
    dirty: boolean;
    editingMode: boolean;
    toggleEditingMode: () => void;
    viewOnly?: boolean;
    disableVariations?: boolean;
    movable?: "both" | "white" | "black" | "turn" | "none";
    boardRef: React.MutableRefObject<HTMLDivElement | null>;
    saveFile?: () => void;
    reload?: () => void;
    addGame?: () => void;
    canTakeBack?: boolean;
    whiteTime?: number;
    blackTime?: number;
    practicing?: boolean;
    viewPawnStructure?: boolean;
    setViewPawnStructure?: (value: boolean) => void;
    takeSnapshot?: () => void;
    deleteMove?: () => void;
    changeTabType?: () => void;
    currentTabType?: "analysis" | "play";
    eraseDrawablesOnClick?: boolean;
    clearShapes?: () => void;
    toggleOrientation?: () => void;
    currentTabSourceType?: string;
    selectedPiece?: Piece | null;
    setSelectedPiece?: (piece: Piece | null) => void;
    startGame?: () => void;
    gameState?: "settingUp" | "playing" | "gameOver";
    startGameDisabled?: boolean;
}

function Board({
    dirty,
    editingMode,
    toggleEditingMode,
    viewOnly,
    disableVariations,
    movable = "turn",
    boardRef,
    saveFile,
    reload,
    addGame,
    canTakeBack,
    whiteTime,
    blackTime,
    practicing,
    viewPawnStructure,
    setViewPawnStructure,
    takeSnapshot,
    deleteMove,
    changeTabType,
    currentTabType,
    eraseDrawablesOnClick,
    clearShapes,
    toggleOrientation,
    currentTabSourceType,
    selectedPiece,
    setSelectedPiece,
    startGame,
    gameState,
    startGameDisabled,
}: ChessboardProps) {
    const { t } = useTranslation();
    const { layout } = useResponsiveLayout();

    const store = useContext(TreeStateContext)!;

    const root = useStore(store, (s) => s.root);
    const rootFen = useStore(store, (s) => s.root.fen);
    const moves = useStore(store, useShallow((s) => getVariationLine(s.root, s.position)));
    const headers = useStore(store, (s) => s.headers);
    const currentNode = useStore(store, (s) => s.currentNode());

    const arrows = useAtomValue(bestMovesFamily({ fen: rootFen, gameMoves: moves }));

    const goToNext = useStore(store, (s) => s.goToNext);
    const goToPrevious = useStore(store, (s) => s.goToPrevious);
    const storeMakeMove = useStore(store, (s) => s.makeMove);
    const setHeaders = useStore(store, (s) => s.setHeaders);
    const storeDeleteMove = useStore(store, (s) => s.deleteMove);
    const storeClearShapes = useStore(store, (s) => s.clearShapes);
    const setShapes = useStore(store, (s) => s.setShapes);
    const setFen = useStore(store, (s) => s.setFen);

    const [pos, error] = positionFromFen(currentNode.fen);

    const moveInput = useAtomValue(moveInputAtom);
    const showDests = useAtomValue(showDestsAtom);
    const showArrows = useAtomValue(showArrowsAtom);
    const showConsecutiveArrows = useAtomValue(showConsecutiveArrowsAtom);
    const storeEraseDrawablesOnClick = useAtomValue(eraseDrawablesOnClickAtom);
    const autoPromote = useAtomValue(autoPromoteAtom);
    const showCoordinates = useAtomValue(showCoordinatesAtom);
    const isBlindfold = useAtomValue(blindfoldAtom);
    const setBlindfold = useSetAtom(blindfoldAtom);

    let dests: Map<SquareName, SquareName[]> = pos ? chessgroundDests(pos) : new Map();

    const [localViewPawnStructure, setLocalViewPawnStructure] = useState(false);
    const [pendingMove, setPendingMove] = useState<NormalMove | null>(null);

    const turn = pos?.turn || "white";
    const orientation = headers.orientation || "white";
    const localToggleOrientation = useCallback(() => {
        setHeaders({
            ...headers,
            fen: root.fen,
            orientation: orientation === "black" ? "white" : "black",
        });
    }, [headers, root.fen, orientation, setHeaders]);

    const localTakeSnapshot = async () => {
        const ref = boardRef?.current;
        if (ref == null) return;
        const refChildNode = ref.children[0]?.children[0]?.children[0] as HTMLElement;
        if (refChildNode == null) return;

        domtoimage.toBlob(refChildNode).then(async (blob) => {
            if (blob == null) return;
            const documentsDirPath: string = await getDocumentDir();

            const filePath = await save({
                title: "Save board snapshot",
                defaultPath: documentsDirPath,
                filters: [{ name: "Png image", extensions: ["png"] }],
            });
            if (filePath == null) return;

            const arrayBuffer = await blob.arrayBuffer();
            await writeFile(filePath, new Uint8Array(arrayBuffer));
            toast.success("Snapshot saved successfully.");
        });
    };

    const keyMap = useAtomValue(keyMapAtom);
    const [evalOpen, setEvalOpen] = useAtom(currentEvalOpenAtom);

    // Native replacement for useHotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (keyMap.SWAP_ORIENTATION?.keys && e.key === keyMap.SWAP_ORIENTATION.keys[0]) {
                (toggleOrientation ?? localToggleOrientation)();
            }
            if (keyMap.TOGGLE_EVAL_BAR?.keys && e.key === keyMap.TOGGLE_EVAL_BAR.keys[0]) {
                setEvalOpen((o) => !o);
            }
            if (keyMap.BLINDFOLD?.keys && e.key === keyMap.BLINDFOLD.keys[0]) {
                setBlindfold((v) => !v);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keyMap, toggleOrientation, localToggleOrientation, setEvalOpen, setBlindfold]);

    const [currentTab, setCurrentTab] = useAtom(currentTabAtom);
    const [deck, setDeck] = useAtom(
        deckAtomFamily({
            file: currentTab?.source?.type === "file" ? currentTab.source.path : "",
            game: currentTab?.gameNumber || 0,
        }),
    );

    async function makeMove(move: NormalMove) {
        if (!pos) return;
        const san = makeSan(pos, move);
        if (practicing) {
            const c = deck.positions.find((c) => c.fen === currentNode.fen);
            if (!c) return;

            let isRecalled = true;
            if (san !== c?.answer) isRecalled = false;
            const i = deck.positions.indexOf(c);

            if (!isRecalled) {
                toast.error(t("common.incorrect"), {
                    description: t("features.board.practice.correctMoveWas", { move: c.answer })
                });
                await new Promise((resolve) => setTimeout(resolve, 500));
                goToNext();
            } else {
                storeMakeMove({ payload: move });
                setPendingMove(null);
            }
            updateCardPerformance(setDeck, i, c.card, isRecalled ? 4 : 1);
        } else {
            storeMakeMove({ payload: move, clock: pos.turn === "white" ? whiteTime : blackTime });
            setPendingMove(null);
        }
    }

    let shapes: DrawShape[] = [];
    if (showArrows && evalOpen && arrows.size > 0 && pos) {
        const entries = Array.from(arrows.entries()).sort((a, b) => a[0] - b[0]);
        for (const [i, moves] of entries) {
            if (i < 4) {
                const bestWinChance = moves[0].winChance;
                for (const [j, { pv, winChance }] of moves.entries()) {
                    const posClone = pos.clone();
                    let prevSquare = null;
                    for (const [ii, uci] of pv.entries()) {
                        const m = parseUci(uci)! as NormalMove;
                        posClone.play(m);
                        const from = makeSquare(m.from)!;
                        const to = makeSquare(m.to)!;
                        if (prevSquare === null) prevSquare = from;

                        const brushSize = match(bestWinChance - winChance)
                            .when((d) => d < 2.5, () => LARGE_BRUSH)
                            .when((d) => d < 5, () => MEDIUM_BRUSH)
                            .otherwise(() => SMALL_BRUSH);

                        if (ii === 0 || (showConsecutiveArrows && j === 0 && ii % 2 === 0)) {
                            if (ii < 5 && !shapes.find((s) => s.orig === from && s.dest === to) && prevSquare === from) {
                                const arrowColor = j === 0 ? arrowColors[i].strong : arrowColors[i].pale;
                                shapes.push({
                                    orig: from, dest: to, brush: arrowColor, modifiers: { lineWidth: brushSize },
                                });
                                prevSquare = to;
                            } else break;
                        }
                    }
                }
            }
        }
    }

    if (currentNode.shapes.length > 0) shapes = shapes.concat(currentNode.shapes);

    const hasClock =
        whiteTime !== undefined || blackTime !== undefined || headers.time_control !== undefined ||
        headers.white_time_control !== undefined || headers.black_time_control !== undefined;

    function localChangeTabType() {
        setCurrentTab((t) => ({ ...t, type: t.type === "analysis" ? "play" : "analysis" }));
    }

    const materialDiff = getMaterialDiff(currentNode.fen);
    const practiceLock = !!practicing && !deck.positions.find((c) => c.fen === currentNode.fen);

    const movableColor = useMemo(() => {
        return practiceLock ? undefined : editingMode ? "both" : match(movable)
            .with("white", () => "white" as const)
            .with("black", () => "black" as const)
            .with("turn", () => turn)
            .with("both", () => "both" as const)
            .with("none", () => undefined)
            .exhaustive();
    }, [practiceLock, editingMode, movable, turn]);

    const annotationColor = annotationColors[currentNode.annotations[0]] || "#6B7280";

    const [enableBoardScroll] = useAtom(enableBoardScrollAtom);
    const [snapArrows] = useAtom(snapArrowsAtom);

    const setBoardFen = useCallback(
        (fen: string) => {
            if (!fen || !editingMode) return;
            const newFen = `${fen} ${currentNode.fen.split(" ").slice(1).join(" ")}`;
            if (newFen !== currentNode.fen) setFen(newFen);
        }, [editingMode, currentNode, setFen],
    );

    useEffect(() => {
        const linkId = "view-pawn-structure-css";
        if (viewPawnStructure) {
            if (!document.getElementById(linkId)) {
                const link = document.createElement("link");
                link.rel = "stylesheet"; link.href = "/pieces/view-pawn-structure.css"; link.id = linkId;
                document.head.appendChild(link);
            }
        } else {
            document.getElementById(linkId)?.remove();
        }
        return () => document.getElementById(linkId)?.remove();
    }, [viewPawnStructure]);

    const square = match(currentNode)
        .with({ san: "O-O" }, ({ halfMoves }) => parseSquare(halfMoves % 2 === 1 ? "g1" : "g8"))
        .with({ san: "O-O-O" }, ({ halfMoves }) => parseSquare(halfMoves % 2 === 1 ? "c1" : "c8"))
        .otherwise((node) => node.move?.to);

    const lastMove = currentNode.move && square !== undefined ? [chessgroundMove(currentNode.move)[0], makeSquare(square)!] : undefined;

    return (
        <div className="w-full h-full flex flex-col gap-2 overflow-hidden max-w-full max-h-full">
            {materialDiff && (
                <div className="flex items-center ml-10 h-[34px]">
                    {hasClock && <Clock color={orientation === "black" ? "white" : "black"} turn={turn} whiteTime={whiteTime} blackTime={blackTime} />}
                    <ShowMaterial diff={materialDiff.diff} pieces={materialDiff.pieces} color={orientation === "white" ? "black" : "white"} />
                </div>
            )}

            <div className="relative flex flex-nowrap gap-3 h-full max-h-[85vh]">
                {currentNode.annotations.length > 0 && currentNode.move && square !== undefined && (
                    <div className="absolute pl-10 w-full h-full">
                        <div className="relative w-full h-full">
                            <AnnotationHint orientation={orientation} square={square} annotation={currentNode.annotations[0]} />
                        </div>
                    </div>
                )}

                <div className="h-full w-[25px] cursor-pointer" onClick={() => setEvalOpen(!evalOpen)}>
                    <EvalBar score={currentNode.score?.value || null} orientation={orientation} />
                </div>

                <div
                    ref={boardRef}
                    style={{ ...(isBasicAnnotation(currentNode.annotations[0]) && { "--light-color": annotationColor, "--dark-color": annotationColor } as any) }}
                    className={`aspect-square h-full shadow-2xl ring-1 ring-border/50 rounded-sm overflow-hidden ${isBlindfold ? "[&_piece]:opacity-0" : ""}`}
                    onClick={() => { (eraseDrawablesOnClick ?? storeEraseDrawablesOnClick) && (clearShapes ?? storeClearShapes)(); }}
                    onWheel={(e) => {
                        if (enableBoardScroll) { e.deltaY > 0 ? goToNext() : goToPrevious(); }
                    }}
                >
                    <PromotionModal pendingMove={pendingMove} cancelMove={() => setPendingMove(null)} confirmMove={(p) => { if (pendingMove) makeMove({ from: pendingMove.from, to: pendingMove.to, promotion: p }); }} turn={turn} orientation={orientation} />

                    <Chessground
                        selectedPiece={selectedPiece}
                        setSelectedPiece={setSelectedPiece}
                        setBoardFen={setBoardFen}
                        orientation={orientation}
                        fen={currentNode.fen}
                        animation={{ enabled: !editingMode }}
                        coordinates={showCoordinates !== "none"}
                        coordinatesOnSquares={showCoordinates === "all"}
                        movable={{
                            free: editingMode,
                            color: movableColor,
                            dests: editingMode || viewOnly ? undefined : disableVariations && currentNode.children.length > 0 ? undefined : dests,
                            showDests,
                            events: {
                                after(orig, dest, metadata) {
                                    if (!editingMode) {
                                        const from = parseSquare(orig)!;
                                        const to = parseSquare(dest)!;
                                        if (pos) {
                                            if (pos.board.get(from)?.role === "pawn" && ((dest[1] === "8" && turn === "white") || (dest[1] === "1" && turn === "black"))) {
                                                if (autoPromote && !metadata.ctrlKey) { makeMove({ from, to, promotion: "queen" }); }
                                                else { setPendingMove({ from, to }); }
                                            } else { makeMove({ from, to }); }
                                        }
                                    }
                                },
                            },
                        }}
                        turnColor={turn}
                        check={pos?.isCheck()}
                        lastMove={editingMode ? undefined : lastMove}
                        premovable={{ enabled: false }}
                        draggable={{ enabled: !viewPawnStructure && !layout.chessBoard.touchOptimized, deleteOnDropOff: editingMode }}
                        selectable={{ enabled: layout.chessBoard.touchOptimized }}
                        drawable={{
                            enabled: true, visible: true, defaultSnapToValidMove: snapArrows, autoShapes: shapes, onChange: setShapes,
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between h-[34px]">
                {materialDiff && (
                    <div className="flex items-center ml-10">
                        {hasClock && <Clock color={orientation} turn={turn} whiteTime={whiteTime} blackTime={blackTime} />}
                        <ShowMaterial diff={materialDiff.diff} pieces={materialDiff.pieces} color={orientation} />
                    </div>
                )}

                {error && <span className="text-center text-sm font-bold text-destructive">{t(chessopsError(error))}</span>}

                {moveInput && <MoveInput currentNode={currentNode} />}

                {layout.chessBoard.layoutType !== "mobile" && (
                    <BoardControlsMenu
                        viewPawnStructure={viewPawnStructure ?? localViewPawnStructure} setViewPawnStructure={setViewPawnStructure ?? setLocalViewPawnStructure}
                        takeSnapshot={takeSnapshot ?? localTakeSnapshot} canTakeBack={canTakeBack} deleteMove={deleteMove ?? storeDeleteMove}
                        changeTabType={changeTabType ?? localChangeTabType} currentTabType={currentTabType} eraseDrawablesOnClick={eraseDrawablesOnClick ?? storeEraseDrawablesOnClick}
                        clearShapes={clearShapes ?? storeClearShapes} disableVariations={disableVariations} editingMode={editingMode} toggleEditingMode={toggleEditingMode}
                        saveFile={saveFile} reload={reload} addGame={addGame} toggleOrientation={toggleOrientation ?? localToggleOrientation}
                        currentTabSourceType={currentTabSourceType} count={currentTabType === "play" ? 3 : 6}
                    />
                )}
            </div>

            {layout.chessBoard.layoutType === "mobile" && (
                <MoveControls
                    viewPawnStructure={viewPawnStructure ?? localViewPawnStructure} setViewPawnStructure={setViewPawnStructure ?? setLocalViewPawnStructure}
                    takeSnapshot={takeSnapshot ?? localTakeSnapshot} canTakeBack={canTakeBack} deleteMove={deleteMove ?? storeDeleteMove}
                    changeTabType={changeTabType ?? localChangeTabType} currentTabType={currentTabType} eraseDrawablesOnClick={eraseDrawablesOnClick ?? storeEraseDrawablesOnClick}
                    clearShapes={clearShapes ?? storeClearShapes} disableVariations={disableVariations} editingMode={editingMode} toggleEditingMode={toggleEditingMode}
                    saveFile={saveFile} dirty={dirty} autoSave={false} reload={reload} addGame={addGame} toggleOrientation={toggleOrientation ?? localToggleOrientation}
                    currentTabSourceType={currentTabSourceType} startGame={startGame} gameState={gameState} startGameDisabled={startGameDisabled}
                />
            )}
        </div>
    );
}

export default memo(Board);