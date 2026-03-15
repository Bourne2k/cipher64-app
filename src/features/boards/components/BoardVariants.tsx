import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLoaderData } from "@tanstack/react-router";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { toast } from "sonner"; // Replaced Mantine notifications
import { Puzzle } from "lucide-react"; // Replaced Tabler IconPuzzle

import type { Piece } from "@lichess-org/chessground/types";

// Context & State
import { TreeStateContext } from "@/components/TreeStateContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
    allEnabledAtom, autoSaveAtom, currentPracticeTabAtom, currentTabAtom,
    currentTabSelectedAtom, enableAllAtom
} from "@/state/atoms";
import { keyMapAtom } from "@/state/keybindings";

// Utils
import { defaultPGN, getMoveText, getPGN } from "@/utils/chess";
import { positionFromFen } from "@/utils/chessops";
import { createFile, isTempImportFile } from "@/utils/files";
import { formatDateToPGN } from "@/utils/format";
import { reloadTab, saveTab, saveToFile, type Tab } from "@/utils/tabs";
import { getNodeAtPath, type TreeNode } from "@/utils/treeReducer";

// Components
import MoveControls from "@/components/MoveControls";
import EditingCard from "./EditingCard";
import EvalListener from "./EvalListener";
import GameNotationWrapper from "./GameNotationWrapper";
import ResponsiveAnalysisPanels from "./ResponsiveAnalysisPanels";
import ResponsiveBoard from "./ResponsiveBoard";
import VariantsNotation from "./VariantsNotation";

// Shadcn UI
import { Button } from "@/components/ui/button";

// --- CUSTOM NATIVE PORTAL COMPONENT ---
// Safely replaces Mantine's <Portal> by waiting for the DOM target to exist
function DOMPortal({ children, targetId }: { children: React.ReactNode; targetId: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const element = document.getElementById(targetId);
    if (!element) return null;

    return createPortal(children, element);
}

export default function BoardVariants() {
    const { t } = useTranslation();

    // Replaced Mantine useToggle
    const [editingMode, setEditingMode] = useState(false);
    const toggleEditingMode = useCallback(() => setEditingMode((v) => !v), []);

    const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
    const [viewPawnStructure, setViewPawnStructure] = useState(false);

    const [currentTab, setCurrentTab] = useAtom(currentTabAtom);
    const autoSave = useAtomValue(autoSaveAtom);

    const loaderData = useLoaderData({ from: "/boards" }) as any;
    const documentDir = loaderData?.documentDir || "";

    const boardRef = useRef<HTMLDivElement | null>(null);

    const store = useContext(TreeStateContext);
    if (!store) return <div className="p-4 text-destructive font-bold">TreeStateContext missing.</div>;

    const dirty = useStore(store, (s) => s.dirty);
    const reset = useStore(store, (s: any) => s.reset);
    const clearShapes = useStore(store, (s: any) => s.clearShapes);
    const setStoreState = useStore(store, (s: any) => s.setState);
    const setStoreSave = useStore(store, (s: any) => s.save);
    const root = useStore(store, (s) => s.root);
    const headers = useStore(store, (s) => s.headers);
    const setFen = useStore(store, (s: any) => s.setFen);
    const position = useStore(store, (s) => s.position);

    const saveFile = useCallback(
        async (showNotification = true) => {
            try {
                if (currentTab?.source != null && currentTab?.source?.type === "file" && !isTempImportFile(currentTab?.source?.path)) {
                    await saveTab(currentTab, store);
                    setStoreSave();
                    if (showNotification) toast.success(t("common.fileSavedSuccessfully", "File saved successfully"));
                } else {
                    await saveToFile({ dir: documentDir, setCurrentTab, tab: currentTab, store });
                    if (showNotification) toast.success(t("common.fileSavedSuccessfully", "File saved successfully"));
                }
            } catch (error) {
                toast.error(t("common.failedToSaveFile", "Failed to save file"));
            }
        },
        [setCurrentTab, currentTab, documentDir, store, setStoreSave, t],
    );

    const boardOrientation = headers.orientation || "white";

    // Generate puzzles from variants
    const generatePuzzles = useCallback(async () => {
        try {
            const filePath = await save({
                defaultPath: `${documentDir}/puzzles-${formatDateToPGN(new Date())}.pgn`,
                filters: [{ name: "PGN", extensions: ["pgn"] }],
            });

            if (!filePath) return;

            const fileName = filePath.replace(/\.pgn$/, "").split(/[/\\]/).pop() || `puzzles-${formatDateToPGN(new Date())}`;
            const puzzles: string[] = [];
            let puzzleCounter = 0;
            const puzzleColor = boardOrientation === "white" ? "white" : "black";
            const currentDate = formatDateToPGN(new Date());
            const MAX_DEPTH = 80;

            const generatePuzzlesFromNode = (node: TreeNode, depth = 0, puzzlePhaseStarted = false): void => {
                if (depth > MAX_DEPTH) return;
                const [pos] = positionFromFen(node.fen);
                if (!pos) return;

                if (!puzzlePhaseStarted && node.children.length >= 2) puzzlePhaseStarted = true;

                if (puzzlePhaseStarted && pos.turn === puzzleColor && node.children.length > 0) {
                    for (const child of node.children) {
                        if (!child.san) continue;
                        puzzleCounter++;
                        const solutionMoveText = getMoveText(child, { glyphs: false, comments: false, extraMarkups: false, isFirst: true }).trim();

                        let puzzlePGN = `[Event "Mini puzzle ${puzzleCounter}"]\n`;
                        puzzlePGN += `[Site "Local"]\n[Date "${currentDate}"]\n[Round "-"]\n`;
                        puzzlePGN += `[White "Puzzle"]\n[Black "?"]\n[Result "*"]\n[SetUp "1"]\n`;
                        puzzlePGN += `[FEN "${node.fen}"]\n[Solution "${solutionMoveText}"]\n\n${solutionMoveText} *\n\n`;

                        puzzles.push(puzzlePGN);
                    }
                }

                for (const child of node.children) {
                    generatePuzzlesFromNode(child, depth + 1, puzzlePhaseStarted);
                }
            };

            generatePuzzlesFromNode(root);
            await createFile({ filename: fileName, filetype: "puzzle", pgn: puzzles.join(""), dir: documentDir });

            toast.success(t("common.puzzlesGeneratedSuccessfully", `Generated ${puzzles.length} puzzles successfully`));
        } catch (error) {
            toast.error(t("common.failedToGeneratePuzzles", "Failed to generate puzzles"));
        }
    }, [root, boardOrientation, documentDir, t]);

    const reloadBoard = useCallback(async () => {
        if (currentTab != null) {
            const state = await reloadTab(currentTab);
            if (state != null) setStoreState(state);
        }
    }, [currentTab, setStoreState]);

    useEffect(() => {
        if (currentTab?.source?.type === "file" && autoSave && dirty) saveFile(false);
    }, [currentTab?.source, saveFile, autoSave, dirty]);

    const filePath = currentTab?.source?.type === "file" ? currentTab.source.path : undefined;

    const addGame = useCallback(() => {
        setCurrentTab((prev: Tab) => {
            if (prev.source?.type === "file") {
                prev.gameNumber = prev.source.numGames;
                prev.source.numGames += 1;
                return { ...prev };
            }
            return prev;
        });
        reset();
        writeTextFile(filePath!, `\n\n${defaultPGN()}\n\n`, { append: true });
    }, [setCurrentTab, reset, filePath]);

    const [, enable] = useAtom(enableAllAtom);
    const allEnabledLoader = useAtomValue(allEnabledAtom);

    const copyFen = useCallback(async () => {
        try {
            const currentNode = getNodeAtPath(root, store.getState().position);
            await navigator.clipboard.writeText(currentNode.fen);
            toast.success(t("keybindings.copyFen", "Copied FEN to clipboard"));
        } catch (error) {
            console.error("Failed to copy FEN:", error);
        }
    }, [root, store, t]);

    const copyPgn = useCallback(async () => {
        try {
            const pgn = getPGN(root, { headers, comments: true, extraMarkups: true, glyphs: true, variations: true });
            await navigator.clipboard.writeText(pgn);
            toast.success(t("keybindings.copyPgn", "Copied PGN to clipboard"));
        } catch (error) {
            console.error("Failed to copy PGN:", error);
        }
    }, [root, headers, t]);

    const keyMap = useAtomValue(keyMapAtom);

    // Replaced useHotkeys with native listener mapping
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            // Basic fallback mapping for copy actions
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c' && e.shiftKey) copyFen(); // Example mapping
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keyMap, copyFen, copyPgn]);

    const [currentTabSelected, setCurrentTabSelected] = useAtom(currentTabSelectedAtom);
    const practiceTabSelected = useAtomValue(currentPracticeTabAtom);

    const isRepertoire = currentTab?.source?.type === "file" && currentTab.source.metadata?.type === "repertoire";
    const isPuzzle = currentTab?.source?.type === "file" && currentTab.source.metadata?.type === "puzzle";
    const practicing = currentTabSelected === "practice" && practiceTabSelected === "train";

    // Hardcode mobile bypass for now, assuming Mosaic desktop view
    const isMobileLayout = false;
    const [topBar] = useState(true);

    return (
        <>
            <EvalListener />
            {isMobileLayout ? (
                <div className="w-full flex-1 overflow-hidden bg-background">
                    <ResponsiveBoard
                        practicing={practicing} dirty={dirty} editingMode={editingMode} toggleEditingMode={toggleEditingMode}
                        boardRef={boardRef} saveFile={saveFile} reload={reloadBoard} addGame={addGame} topBar={topBar}
                        editingCard={editingMode ? <EditingCard boardRef={boardRef} setEditingMode={toggleEditingMode as any} selectedPiece={selectedPiece} setSelectedPiece={setSelectedPiece} /> : undefined}
                        viewPawnStructure={viewPawnStructure} setViewPawnStructure={setViewPawnStructure} selectedPiece={selectedPiece} setSelectedPiece={setSelectedPiece}
                        canTakeBack={false} changeTabType={() => setCurrentTab((prev: Tab) => ({ ...prev, type: "play" }))} currentTabType="analysis" clearShapes={clearShapes} disableVariations={false} currentTabSourceType={currentTab?.source?.type || undefined}
                    />
                </div>
            ) : (
                <>
                    <DOMPortal targetId="left">
                        <ResponsiveBoard
                            practicing={practicing} dirty={dirty} editingMode={editingMode} toggleEditingMode={toggleEditingMode}
                            boardRef={boardRef} saveFile={saveFile} reload={reloadBoard} addGame={addGame} topBar={false}
                            editingCard={editingMode ? <EditingCard boardRef={boardRef} setEditingMode={toggleEditingMode as any} selectedPiece={selectedPiece} setSelectedPiece={setSelectedPiece} /> : undefined}
                            viewPawnStructure={viewPawnStructure} setViewPawnStructure={setViewPawnStructure} selectedPiece={selectedPiece} setSelectedPiece={setSelectedPiece}
                            canTakeBack={false} changeTabType={() => setCurrentTab((prev: Tab) => ({ ...prev, type: "play" }))} currentTabType="analysis" clearShapes={clearShapes} disableVariations={false} currentTabSourceType={currentTab?.source?.type || undefined}
                        />
                    </DOMPortal>

                    <DOMPortal targetId="topRight">
                        <ResponsiveAnalysisPanels currentTab={currentTabSelected} onTabChange={(v) => setCurrentTabSelected(v || "info")} isRepertoire={isRepertoire} isPuzzle={isPuzzle} />
                    </DOMPortal>
                </>
            )}

            <GameNotationWrapper
                topBar
                editingMode={editingMode}
                editingCard={<EditingCard boardRef={boardRef} setEditingMode={toggleEditingMode as any} selectedPiece={selectedPiece} setSelectedPiece={setSelectedPiece} />}
            >
                <div className="flex flex-col h-full">
                    <VariantsNotation topBar={topBar} editingMode={editingMode} />
                    <MoveControls readOnly />
                    <div className="p-3 shrink-0 mt-auto">
                        <Button variant="secondary" className="w-full font-semibold shadow-sm" onClick={generatePuzzles}>
                            <Puzzle className="w-4 h-4 mr-2" />
                            {t("common.generatePuzzles", "Generate Puzzles")}
                        </Button>
                    </div>
                </div>
            </GameNotationWrapper>
        </>
    );
}