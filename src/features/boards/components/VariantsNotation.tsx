import { INITIAL_FEN } from "chessops/fen";
import equal from "fast-deep-equal";
import { useAtom, useAtomValue } from "jotai";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { Eye, EyeOff, FileText, FileX } from "lucide-react"; // Replaced Tabler icons

import { Comment } from "@/components/Comment";
import CompleteMoveCell from "@/components/CompleteMoveCell";
import OpeningName from "@/components/OpeningName";
import { TreeStateContext } from "@/components/TreeStateContext";
import { currentInvisibleAtom } from "@/state/atoms";
import { keyMapAtom } from "@/state/keybindings";
import type { TreeNode } from "@/utils/treeReducer";

// Shadcn UI
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const variationRefs = {
  variants: React.createRef<HTMLSpanElement>(),
};

function hasMultipleChildrenInChain(node: TreeNode): boolean {
  if (!node.children) return false;
  if (node.children.length > 1) return true;
  if (node.children.length === 1) {
    return hasMultipleChildrenInChain(node.children[0]);
  }
  return false;
}

function VariantsNotation({ topBar, editingMode }: { topBar?: boolean; editingMode?: boolean }) {
  const store = useContext(TreeStateContext);
  if (!store) throw new Error("VariantsNotation must be used within a TreeStateProvider");

  const root = useStore(store, (s) => s.root);
  const currentFen = useStore(store, (s) => s.currentNode().fen);
  const headers = useStore(store, (s) => s.headers);
  const position = useStore(store, (s) => s.position);

  const viewport = useRef<HTMLDivElement>(null);
  const [invisibleValue, setInvisible] = useAtom(currentInvisibleAtom);
  
  // Replaced Mantine useToggle
  const [showComments, setShowComments] = useState(true);
  const toggleComments = () => setShowComments(v => !v);

  const invisible = topBar && invisibleValue;
  const keyMap = useAtomValue(keyMapAtom);
  const { t } = useTranslation();

  // Native hotkey replacement for useHotkeys
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
          // Example implementation: Assuming keyMap.TOGGLE_BLUR.keys[0] is something like 'b'
          if (e.key === keyMap.TOGGLE_BLUR?.keys?.[0]) {
              setInvisible((prev: boolean) => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMap, setInvisible]);

  useEffect(() => {
    if (viewport.current && variationRefs.variants.current) {
      viewport.current.scrollTo({
        top: variationRefs.variants.current.offsetTop - 65,
        behavior: "smooth",
      });
    }
  }, [currentFen]);

  function collectAllVariations(node: TreeNode, currentPath: number[]): Array<{ variation: TreeNode; path: number[]; parentHalfMoves: number }> {
    const variations: Array<{ variation: TreeNode; path: number[]; parentHalfMoves: number }> = [];
    if (node.children.length > 1) {
      node.children.slice(1).forEach((variation, index) => {
        variations.push({ variation, path: [...currentPath, index + 1], parentHalfMoves: node.halfMoves });
      });
    }
    if (node.children.length > 0) {
      const mainLineVariations = collectAllVariations(node.children[0], [...currentPath, 0]);
      variations.push(...mainLineVariations);
    }
    return variations;
  }

  function RenderVariationLine({
    tree, path, depth = 0, first = false, targetRef, showVariationsAfter = true, indentSize = 0,
  }: {
    tree: TreeNode; path: number[]; depth?: number; first?: boolean; targetRef: React.RefObject<HTMLSpanElement>; showVariationsAfter?: boolean; indentSize?: number;
  }) {
    if (tree.san) {
      const currentPath = path;
      const variations = tree.children;

      return (
        <>
          <CompleteMoveCell
            targetRef={depth === 0 && path.length === 0 ? targetRef as any : variationRefs.variants as any}
            annotations={tree.annotations}
            comment={tree.comment}
            halfMoves={tree.halfMoves}
            move={tree.san}
            fen={tree.fen}
            movePath={currentPath}
            showComments={showComments}
            isStart={equal(currentPath, headers.start)}
            first={first}
          />
          {variations && variations.length > 1 ? (
            <>
              {variations.map((childVariation, index) => (
                <VariationBranch
                  key={childVariation.fen} variation={childVariation} path={[...path, index]} depth={depth + 1} start={headers.start} targetRef={targetRef} parentHalfMoves={tree.halfMoves} isRootLevel={false}
                />
              ))}
            </>
          ) : variations && variations.length === 1 ? (
            <RenderVariationLine tree={variations[0]} path={[...path, 0]} depth={depth + 1} targetRef={targetRef} showVariationsAfter={showVariationsAfter} indentSize={indentSize} />
          ) : null}
        </>
      );
    }

    const variations = tree.children;
    if (!variations?.length) return null;

    const newPath = [...path, 0];

    return (
      <>
        <CompleteMoveCell
          targetRef={depth === 0 && path.length === 0 ? targetRef as any : variationRefs.variants as any}
          annotations={variations[0].annotations} comment={variations[0].comment} halfMoves={variations[0].halfMoves} move={variations[0].san} fen={variations[0].fen} movePath={newPath} showComments={showComments} isStart={equal(newPath, headers.start)} first={first}
        />
        {variations.length > 1 ? (
          <>
            {variations.map((childVariation, index) => (
              <VariationBranch
                key={childVariation.fen} variation={childVariation} path={[...path, index]} depth={depth + 1} start={headers.start} targetRef={targetRef} parentHalfMoves={root.halfMoves} isRootLevel={false}
              />
            ))}
          </>
        ) : (
          <RenderVariationLine tree={variations[0]} path={newPath} depth={depth + 1} targetRef={targetRef} showVariationsAfter={showVariationsAfter} indentSize={indentSize} />
        )}
      </>
    );
  }

  function VariationBranch({
    variation, path, depth, start, targetRef, parentHalfMoves, isRootLevel = false,
  }: {
    variation: TreeNode; path: number[]; depth: number; start?: number[]; targetRef: React.RefObject<HTMLSpanElement>; parentHalfMoves?: number; isRootLevel?: boolean;
  }) {
    if (!variation.san && !variation.children?.length) return null;

    const firstMoveHalfMoves = variation.halfMoves;
    const moveNumber = Math.floor((firstMoveHalfMoves - 1) / 2) + 1;
    const isBlackMove = (firstMoveHalfMoves - 1) % 2 === 1;

    const indentSize = depth * 0.75;
    const marginLeft = `${indentSize}rem`;

    const renderVariationContent = () => (
      <>
        {isBlackMove && <span className="text-muted-foreground mr-1">{moveNumber}...</span>}
        <CompleteMoveCell
          targetRef={depth === 0 && path.length === 0 ? targetRef as any : variationRefs.variants as any}
          annotations={variation.annotations} comment={variation.comment} halfMoves={variation.halfMoves} move={variation.san!} fen={variation.fen} movePath={path} showComments={showComments} isStart={equal(path, start)} first={false}
        />
        {variation.children.length > 1 ? (
          <>
            {variation.children.map((childVariation, index) => (
              <VariationBranch
                key={childVariation.fen} variation={childVariation} path={[...path, index]} depth={depth + 1} start={start} targetRef={targetRef} parentHalfMoves={variation.halfMoves} isRootLevel={false}
              />
            ))}
          </>
        ) : variation.children.length === 1 ? (
          <RenderVariationLine tree={variation.children[0]} path={[...path, 0]} depth={depth + 1} targetRef={targetRef} showVariationsAfter={true} indentSize={indentSize} />
        ) : null}
      </>
    );

    return (
      <div style={{ marginLeft }} className="my-0.5 block leading-relaxed">
        <span className="text-muted-foreground mr-1">(</span>
        <div className="inline">{renderVariationContent()}</div>
        <span className="text-muted-foreground ml-1">)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-md border border-border/50 relative overflow-hidden">
      {topBar && (
        <NotationHeader
          showComments={showComments}
          toggleComments={toggleComments}
          invisible={invisible ?? false}
          setInvisible={setInvisible}
        />
      )}
      <ScrollArea className="flex-1" ref={viewport}>
        <div className="p-4 relative min-h-full">
          {/* Blur Overlay replacing Mantine <Overlay> */}
          {invisible && (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60" />
          )}
          
          {showComments && root.comment && <Comment comment={root.comment} />}
          
          {root.children.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("features.gameNotation.noMoves", "No moves yet.")}</div>
          ) : (
            <div>
              {root.children.length > 0 && (
                <>
                  {root.children.map((variation, index) => (
                    <VariationBranch
                      key={`root-variation-${index}-${variation.fen}`} variation={variation} path={[index]} depth={0} start={headers.start} targetRef={variationRefs.variants as any} parentHalfMoves={root.halfMoves} isRootLevel={false}
                    />
                  ))}
                </>
              )}
            </div>
          )}
          
          {headers.result && headers.result !== "*" && (
            <div className="text-center mt-4 pt-4 border-t border-border/40">
              <div className="font-bold">{headers.result}</div>
              <div className="italic text-muted-foreground text-sm">
                {headers.result === "1/2-1/2" ? t("chess.outcome.draw", "Draw") : headers.result === "1-0" ? t("chess.outcome.whiteWins", "White Wins") : t("chess.outcome.blackWins", "Black Wins")}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function NotationHeader({
  showComments,
  toggleComments,
  invisible,
  setInvisible,
}: {
  showComments: boolean;
  toggleComments: () => void;
  invisible: boolean;
  setInvisible: (value: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-2">
          <OpeningName />
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setInvisible((prev: boolean) => !prev)}>
                  {invisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{invisible ? t("features.gameNotation.showMoves", "Show Moves") : t("features.gameNotation.hideMoves", "Hide Moves")}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleComments}>
                  {showComments ? <FileText className="h-4 w-4" /> : <FileX className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showComments ? t("features.gameNotation.hideComments", "Hide Comments") : t("features.gameNotation.showComments", "Show Comments")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="h-px bg-border w-full" />
      </div>
    </TooltipProvider>
  );
}

export default VariantsNotation;