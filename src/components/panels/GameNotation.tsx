import {
    IconArrowRight,
    IconArrowsSplit,
    IconArticle,
    IconArticleOff,
    IconChevronDown,
    IconChevronRight,
    IconEye,
    IconEyeOff,
    IconListTree,
    IconPoint,
    IconPointFilled,
} from "@tabler/icons-react";
import { INITIAL_FEN } from "chessops/fen";
import equal from "fast-deep-equal";
import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { Comment } from "@/components/Comment";
import { TreeStateContext } from "@/components/TreeStateContext";
import { currentInvisibleAtom } from "@/state/atoms";
import { keyMapAtom } from "@/state/keybindings";
import type { TreeNode } from "@/utils/treeReducer";
import CompleteMoveCell from "./CompleteMoveCell";
import OpeningName from "./OpeningName";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type VariationState = "mainline" | "variations" | "repertoire";

const variationRefs = {
    mainline: React.createRef<HTMLSpanElement>(),
    variations: React.createRef<HTMLSpanElement>(),
    repertoire: React.createRef<HTMLSpanElement>(),
};

function isOnNextDivergenceFromMainline(node: TreeNode, remainingPath: number[]): boolean {
    if (remainingPath.length === 0) return false;
    if (!node.children) return false;
    if (node.children.length > 1) {
        if (remainingPath[0] > node.children.length) return false;
        return remainingPath[0] !== 0;
    }
    const nextNode = node.children[remainingPath[0]];
    if (!nextNode) return false;
    return isOnNextDivergenceFromMainline(nextNode, remainingPath.slice(1));
}

function hasMultipleChildrenInChain(node: TreeNode): boolean {
    if (!node.children) return false;
    if (node.children.length > 1) return true;
    if (node.children.length === 1) {
        return hasMultipleChildrenInChain(node.children[0]);
    }
    return false;
}

function hasMultipleChildrenUntilPosition(node: TreeNode, remainingPath: number[]): boolean {
    if (remainingPath.length === 0) return false;
    if (!node.children) return false;
    if (node.children.length > 1) return true;
    const nextNode = node.children[remainingPath[0]];
    if (!nextNode) return false;
    return hasMultipleChildrenUntilPosition(nextNode, remainingPath.slice(1));
}

function GameNotation({
    topBar,
    initialVariationState = "mainline",
}: {
    topBar?: boolean;
    initialVariationState?: VariationState;
}) {
    const store = useContext(TreeStateContext);
    if (!store) {
        throw new Error("GameNotation must be used within a TreeStateProvider");
    }

    const root = useStore(store, (s) => s.root);
    const currentFen = useStore(store, (s) => s.currentNode().fen);
    const headers = useStore(store, (s) => s.headers);

    const viewport = useRef<HTMLDivElement>(null);

    const [invisibleValue, setInvisible] = useAtom(currentInvisibleAtom);

    // Custom hook replacement for mantine's useToggle
    const [variationState, setVariationState] = useState<VariationState>(initialVariationState);
    const toggleVariationState = useCallback(() => {
        const states: VariationState[] = ["mainline", "variations", "repertoire"];
        setVariationState((prev) => states[(states.indexOf(prev) + 1) % states.length]);
    }, []);

    const [showComments, setShowComments] = useState(true);
    const toggleComments = () => setShowComments((prev) => !prev);

    const invisible = topBar && invisibleValue;
    const keyMap = useAtomValue(keyMapAtom);

    // Custom native replacement for mantine's useHotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Basic implementation for a hotkey match. 
            if (e.key.toLowerCase() === keyMap.TOGGLE_BLUR?.keys?.toLowerCase()) {
                setInvisible((prev: boolean) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [keyMap.TOGGLE_BLUR, setInvisible]);

    useEffect(() => {
        if (viewport.current) {
            if (currentFen === INITIAL_FEN) {
                viewport.current.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                const currentRef = variationRefs[variationState];
                if (currentRef?.current) {
                    viewport.current.scrollTo({
                        top: currentRef.current.offsetTop - 65,
                        behavior: "smooth",
                    });
                }
            }
        }
    }, [currentFen, variationState]);

    return (
        <div className="relative flex flex-col flex-1 border border-border rounded-md bg-card text-card-foreground p-4 overflow-hidden">
            <div className="flex flex-col h-full gap-0">
                {topBar && (
                    <NotationHeader
                        showComments={showComments}
                        toggleComments={toggleComments}
                        variationState={variationState}
                        toggleVariationState={toggleVariationState}
                    />
                )}

                {/* Native scrollable div cleanly replaces Mantine ScrollArea to guarantee the ref handles programmatic scrolling */}
                <div ref={viewport} className="flex-1 overflow-y-auto overflow-x-hidden pt-4 relative">
                    <div className="flex flex-col">
                        <div className="relative">
                            {invisible && (
                                <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[8px]" />
                            )}
                            {showComments && root.comment && <Comment comment={root.comment} />}
                            <div
                                style={{
                                    display: variationState === "mainline" ? "block" : "none",
                                }}
                            >
                                <RenderMainline
                                    tree={root}
                                    depth={0}
                                    path={[]}
                                    start={headers.start}
                                    first={true}
                                    showComments={showComments}
                                    // @ts-expect-error
                                    targetRef={variationRefs.mainline}
                                    toggleVariationState={toggleVariationState}
                                />
                            </div>
                            <div
                                style={{
                                    display: variationState === "variations" ? "block" : "none",
                                }}
                            >
                                <RenderVariations
                                    tree={root}
                                    depth={0}
                                    path={[]}
                                    start={headers.start}
                                    first={true}
                                    showComments={showComments}
                                    renderMoves={false}
                                    nextLevelExpanded={true}
                                    // @ts-expect-error
                                    targetRef={variationRefs.variations}
                                    variationState={variationState}
                                    childInPath={false}
                                />
                            </div>
                            <div
                                style={{
                                    display: variationState === "repertoire" ? "block" : "none",
                                }}
                            >
                                <RenderRepertoire
                                    tree={root}
                                    depth={0}
                                    path={[]}
                                    start={headers.start}
                                    showComments={showComments}
                                    nextLevelExpanded={true}
                                    // @ts-expect-error
                                    targetRef={variationRefs.repertoire}
                                    variationState={variationState}
                                />
                            </div>
                        </div>
                        {headers.result && headers.result !== "*" && (
                            <div className="text-center mt-4">
                                {headers.result}
                                <br />
                                <span className="italic">
                                    {headers.result === "1/2-1/2"
                                        ? "Draw"
                                        : headers.result === "1-0"
                                            ? "White wins"
                                            : "Black wins"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotationHeader({
    showComments,
    toggleComments,
    variationState,
    toggleVariationState,
}: {
    showComments: boolean;
    toggleComments: () => void;
    variationState: VariationState;
    toggleVariationState: () => void;
}) {
    const [invisible, setInvisible] = useAtom(currentInvisibleAtom);

    return (
        <TooltipProvider>
            <div className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                    <OpeningName />
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setInvisible((prev: boolean) => !prev)}>
                                    {invisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {invisible ? "Show moves" : "Hide moves"}
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={toggleComments}>
                                    {showComments ? <IconArticle size={16} /> : <IconArticleOff size={16} />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {showComments ? "Hide comments" : "Show comments"}
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={toggleVariationState}>
                                    {variationState === "variations" ? (
                                        <IconArrowsSplit size={16} />
                                    ) : variationState === "repertoire" ? (
                                        <IconListTree size={16} />
                                    ) : (
                                        <IconArrowRight size={16} />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {variationState === "variations"
                                    ? "Show variations"
                                    : variationState === "repertoire"
                                        ? "Repertoire view"
                                        : "Main line"}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <hr className="border-border" />
            </div>
        </TooltipProvider>
    );
}

function RenderMainline({
    tree,
    depth,
    path,
    start,
    first,
    showComments,
    targetRef,
    toggleVariationState,
}: {
    tree: TreeNode;
    depth: number;
    start?: number[];
    first?: boolean;
    showComments: boolean;
    targetRef: React.RefObject<HTMLSpanElement>;
    path: number[];
    toggleVariationState: () => void;
}) {
    const store = useContext(TreeStateContext);
    if (!store) {
        throw new Error("RenderMainline must be used within a TreeStateProvider");
    }
    const currentPosition = useStore(store, (s) => s.position);

    const variations = tree.children;
    if (!variations?.length) return null;

    const newPath = [...path, 0];
    const isAtDivergence =
        currentPosition.length > path.length &&
        currentPosition.slice(0, path.length).every((v, i) => path[i] === v) &&
        currentPosition[path.length] > 0;

    return (
        <>
            {isAtDivergence && (
                <span className="inline-block text-[80%]">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={toggleVariationState}
                                    className="px-1.5 py-0.5 mx-0.5 rounded transition-colors hover:bg-muted bg-muted/50 inline-flex items-center justify-center cursor-pointer"
                                >
                                    <IconArrowsSplit size={16} className="align-text-bottom" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Show variations</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </span>
            )}
            <CompleteMoveCell
                annotations={variations[0].annotations}
                comment={variations[0].comment}
                halfMoves={variations[0].halfMoves}
                move={variations[0].san}
                fen={variations[0].fen}
                movePath={newPath}
                showComments={showComments}
                isStart={equal(newPath, start)}
                first={first}
                targetRef={targetRef}
            />
            <RenderMainline
                tree={variations[0]}
                depth={depth}
                start={start}
                showComments={showComments}
                targetRef={targetRef}
                path={newPath}
                toggleVariationState={toggleVariationState}
            />
        </>
    );
}

function RenderVariations({
    tree,
    depth,
    path,
    start,
    first,
    showComments,
    renderMoves,
    nextLevelExpanded,
    childInPath,
    targetRef,
    variationState,
}: {
    tree: TreeNode;
    depth: number;
    path: number[];
    start?: number[];
    first?: boolean;
    showComments: boolean;
    renderMoves: boolean;
    nextLevelExpanded: boolean;
    childInPath: boolean;
    targetRef: React.RefObject<HTMLSpanElement>;
    variationState: VariationState;
}) {
    if (!renderMoves) {
        const variationCells = [];
        let currentNode = tree;
        let currentPath = [...path];
        let parentNode = currentNode;

        if (!currentNode.children?.length) return null;

        variationCells.push(
            <VariationCell
                key={currentNode.fen}
                variation={currentNode}
                path={currentPath}
                variationState={variationState}
                targetRef={targetRef}
                start={start}
                showComments={showComments}
                depth={depth + 1}
                startsMainline={true}
                childInPath={childInPath}
                nextLevelExpanded={nextLevelExpanded}
            />,
        );

        let pathIncludesChild = childInPath;
        while (currentNode.children.length > 0) {
            parentNode = currentNode;
            currentNode = currentNode.children[0];
            if (!pathIncludesChild) {
                currentPath = [...currentPath, 0];
            } else {
                pathIncludesChild = false;
            }

            if (parentNode.children.length > 1 && currentNode.children.length > 0) {
                variationCells.push(
                    <VariationCell
                        key={currentNode.fen}
                        variation={currentNode}
                        path={currentPath}
                        variationState={variationState}
                        targetRef={targetRef}
                        start={start}
                        showComments={showComments}
                        depth={depth + 1}
                        startsMainline={false}
                        childInPath={false}
                        nextLevelExpanded={nextLevelExpanded}
                    />,
                );
            }
        }

        return <>{variationCells}</>;
    }

    const variations = tree.children;
    if (!variations?.length) return null;

    const newMainlinePath = childInPath ? [...path] : [...path, 0];

    if (variations.length === 1) {
        return (
            <>
                <CompleteMoveCell
                    targetRef={targetRef}
                    annotations={variations[0].annotations}
                    comment={variations[0].comment}
                    halfMoves={variations[0].halfMoves}
                    move={variations[0].san}
                    fen={variations[0].fen}
                    movePath={newMainlinePath}
                    showComments={showComments}
                    isStart={equal(newMainlinePath, start)}
                    first={first}
                />
                <RenderVariations
                    tree={variations[0]}
                    depth={depth}
                    start={start}
                    showComments={showComments}
                    targetRef={targetRef}
                    path={newMainlinePath}
                    variationState={variationState}
                    renderMoves={true}
                    childInPath={false}
                    nextLevelExpanded={nextLevelExpanded}
                />
            </>
        );
    }

    return (
        <>
            <CompleteMoveCell
                targetRef={targetRef}
                annotations={variations[0].annotations}
                comment={variations[0].comment}
                halfMoves={variations[0].halfMoves}
                move={variations[0].san}
                fen={variations[0].fen}
                movePath={newMainlinePath}
                showComments={showComments}
                isStart={equal(newMainlinePath, start)}
                first={first}
            />
            {variations.slice(1).map((variation, index) => (
                <RenderVariations
                    key={variation.fen}
                    tree={{ ...variation, children: [variation] }}
                    depth={depth}
                    start={start}
                    showComments={showComments}
                    targetRef={targetRef}
                    path={[...newMainlinePath.slice(0, -1), index + 1]}
                    variationState={variationState}
                    renderMoves={false}
                    childInPath={true}
                    nextLevelExpanded={nextLevelExpanded}
                />
            ))}
        </>
    );
}

function VariationCell({
    variation,
    path,
    depth,
    start,
    showComments,
    startsMainline,
    childInPath,
    nextLevelExpanded,
    targetRef,
    variationState,
}: {
    variation: TreeNode;
    path: number[];
    variationState: VariationState;
    targetRef: React.RefObject<HTMLSpanElement>;
    start?: number[];
    showComments: boolean;
    depth: number;
    startsMainline: boolean;
    childInPath: boolean;
    nextLevelExpanded: boolean;
}) {
    const store = useContext(TreeStateContext);
    if (!store) {
        throw new Error("VariationCell must be used within a TreeStateProvider");
    }
    const positionPath = useStore(store, (s) => s.position);

    const currentPath = childInPath ? path.slice(0, -1) : [...path];
    const childIndex = childInPath ? path[path.length - 1] : 0;
    const remainingPositionPath = positionPath.slice(currentPath.length);

    const isOnPath = currentPath.every((value, i) => positionPath[i] === value);
    const isPositionDeeper = positionPath.length > currentPath.length;
    const isDiverging =
        remainingPositionPath.length > 0 &&
        ((remainingPositionPath[0] !== 0 && childIndex === 0) ||
            (remainingPositionPath[0] === childIndex &&
                isOnNextDivergenceFromMainline(variation, [0, ...remainingPositionPath.slice(1)])));
    const isInCurrentPath = isOnPath && isPositionDeeper && isDiverging;

    const [expanded, setExpanded] = useState(() => isInCurrentPath);
    const [chevronClicked, setChevronClicked] = useState(false);

    useEffect(() => {
        if (!expanded && variationState === "variations" && isInCurrentPath) {
            setExpanded(true);
        }
    }, [variationState, expanded, isInCurrentPath]);

    if (depth > 1 && !nextLevelExpanded) {
        return null;
    }

    return (
        <div className={depth === 1 ? undefined : "border-l-2 border-border/50 pl-2 ml-1 mt-1 mb-1 block"}>
            {hasMultipleChildrenInChain(variation) ? (
                expanded ? (
                    isInCurrentPath ? (
                        <span className="w-[0.6rem] inline-block" />
                    ) : (
                        <IconChevronDown
                            size="0.6rem"
                            className="inline-block cursor-pointer transition-opacity duration-400 opacity-0 hover:opacity-100"
                            style={{ opacity: chevronClicked ? 1 : undefined }}
                            onMouseLeave={() => setChevronClicked(false)}
                            onClick={() => setExpanded(false)}
                        />
                    )
                ) : (
                    <IconChevronRight
                        size="0.6rem"
                        className="inline-block cursor-pointer"
                        onClick={() => {
                            setChevronClicked(true);
                            setExpanded(true);
                        }}
                    />
                )
            ) : (
                <span className="w-[0.6rem] inline-block" />
            )}
            {startsMainline ? (
                <IconPointFilled size="0.6rem" className="inline-block mx-0.5" />
            ) : (
                <IconPoint size="0.6rem" className="inline-block mx-0.5" />
            )}
            <RenderVariations
                tree={variation}
                depth={depth}
                path={path}
                start={start}
                showComments={showComments}
                first={true}
                renderMoves={true}
                nextLevelExpanded={expanded}
                targetRef={targetRef}
                variationState={variationState}
                childInPath={childInPath}
            />
        </div>
    );
}

function RenderRepertoire({
    tree,
    depth,
    path,
    start,
    first,
    showComments,
    nextLevelExpanded,
    targetRef,
    variationState,
}: {
    tree: TreeNode;
    depth: number;
    start?: number[];
    path: number[];
    first?: boolean;
    showComments: boolean;
    nextLevelExpanded?: boolean;
    targetRef: React.RefObject<HTMLSpanElement>;
    variationState: VariationState;
}) {
    const variations = tree.children;
    if (!variations?.length) return null;

    if (variations.length === 1 && depth > 0) {
        const newPath = [...path, 0];
        return (
            <>
                <CompleteMoveCell
                    targetRef={targetRef}
                    annotations={variations[0].annotations}
                    comment={variations[0].comment}
                    halfMoves={variations[0].halfMoves}
                    move={variations[0].san}
                    fen={variations[0].fen}
                    movePath={newPath}
                    showComments={showComments}
                    isStart={equal(newPath, start)}
                    first={first}
                />
                <RenderRepertoire
                    targetRef={targetRef}
                    tree={variations[0]}
                    depth={depth}
                    start={start}
                    showComments={showComments}
                    path={newPath}
                    variationState={variationState}
                    nextLevelExpanded={nextLevelExpanded}
                />
            </>
        );
    }

    return (
        <>
            {variations.map((variation, index) => (
                <RepertoireCell
                    key={variation.fen}
                    variation={variation}
                    path={[...path, index]}
                    targetRef={targetRef}
                    start={start}
                    showComments={showComments}
                    depth={depth + 1}
                    variationState={variationState}
                    nextLevelExpanded={nextLevelExpanded}
                />
            ))}
        </>
    );
}

function RepertoireCell({
    variation,
    path,
    depth,
    start,
    showComments,
    nextLevelExpanded,
    targetRef,
    variationState,
}: {
    variation: TreeNode;
    path: number[];
    variationState: VariationState;
    targetRef: React.RefObject<HTMLSpanElement>;
    start?: number[];
    showComments: boolean;
    depth: number;
    nextLevelExpanded?: boolean;
}) {
    const store = useContext(TreeStateContext);
    if (!store) {
        throw new Error("RepertoireCell must be used within a TreeStateProvider");
    }
    const position = useStore(store, (s) => s.position);

    const isOnPath = path.every((value, i) => position[i] === value);
    const isPositionDeeper = position.length > path.length;
    const remainingPath = position.slice(path.length);
    const isInCurrentPath = isPositionDeeper && isOnPath && hasMultipleChildrenUntilPosition(variation, remainingPath);

    const [expanded, setExpanded] = useState(() => isInCurrentPath);
    const [chevronClicked, setChevronClicked] = useState(false);

    useEffect(() => {
        if (!expanded && variationState === "repertoire" && isInCurrentPath) {
            setExpanded(true);
        }
    }, [variationState, expanded, isInCurrentPath]);

    if (depth > 1 && !nextLevelExpanded) {
        return null;
    }

    return (
        <div className={depth === 1 ? undefined : "border-l-2 border-border/50 pl-2 ml-1 mt-1 mb-1 block"}>
            {hasMultipleChildrenInChain(variation) ? (
                expanded ? (
                    isInCurrentPath ? (
                        <span className="w-[0.6rem] inline-block" />
                    ) : (
                        <IconChevronDown
                            size="0.6rem"
                            className="inline-block cursor-pointer transition-opacity duration-400 opacity-0 hover:opacity-100"
                            style={{ opacity: chevronClicked ? 1 : undefined }}
                            onMouseLeave={() => setChevronClicked(false)}
                            onClick={() => setExpanded(false)}
                        />
                    )
                ) : (
                    <IconChevronRight
                        size="0.6rem"
                        className="inline-block cursor-pointer"
                        onClick={() => {
                            setChevronClicked(true);
                            setExpanded(true);
                        }}
                    />
                )
            ) : (
                <span className="w-[0.6rem] inline-block" />
            )}
            <IconPointFilled size="0.6rem" className="inline-block mx-0.5" />
            <CompleteMoveCell
                annotations={variation.annotations}
                comment={variation.comment}
                halfMoves={variation.halfMoves}
                move={variation.san}
                fen={variation.fen}
                movePath={path}
                showComments={showComments}
                isStart={equal(path, start)}
                first={true}
                targetRef={targetRef}
            />
            <RenderRepertoire
                tree={variation}
                depth={depth}
                path={path}
                start={start}
                showComments={showComments}
                nextLevelExpanded={expanded}
                targetRef={targetRef}
                variationState={variationState}
            />
        </div>
    );
}

export default GameNotation;