import type { Piece } from "@lichess-org/chessground/types";
import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ResponsiveLoadingWrapper } from "@/components/ResponsiveLoadingWrapper";
import { ResponsiveSkeleton } from "@/components/ResponsiveSkeleton";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import Board from "./Board";
import MobileBoardLayout from "./MobileBoardLayout";
import { Button } from "@/components/ui/button";

interface ResponsiveBoardProps {
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
    topBar?: boolean;
    editingCard?: React.ReactNode;
    isLoading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
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

function ResponsiveBoard(props: ResponsiveBoardProps) {
    const { t } = useTranslation();
    // Bypass legacy hook for now, assume desktop layout to force mosaic rendering safely
    // const { layout } = useResponsiveLayout();
    const containerRef = useRef<HTMLDivElement>(null);

    const [isInitializing, setIsInitializing] = useState(true);
    const [initializationError, setInitializationError] = useState<Error | null>(null);

    const isMobileLayout = false; // Hardcoded fallback for layout.chessBoard.layoutType === "mobile"

    useEffect(() => {
        const initializeBoard = async () => {
            try {
                setIsInitializing(true);
                setInitializationError(null);
                await new Promise((resolve) => setTimeout(resolve, 50)); // Smooth UX buffer
                setIsInitializing(false);
            } catch (error) {
                setInitializationError(error as Error);
                setIsInitializing(false);
            }
        };
        initializeBoard();
    }, []);

    const handleRetry = useCallback(() => {
        setInitializationError(null);
        setIsInitializing(true);
    }, []);

    if (isInitializing) {
        return (
            <div ref={containerRef} className="w-full h-full flex justify-center items-center">
                <ResponsiveLoadingWrapper isLoading={true}>
                    <ResponsiveSkeleton type="board" />
                </ResponsiveLoadingWrapper>
            </div>
        );
    }

    if (initializationError) {
        return (
            <div ref={containerRef} className="w-full h-full flex flex-col justify-center items-center gap-4">
                <div className="text-sm font-semibold">{t("errors.failedToInitializeChessBoard", "Failed to initialize board")}</div>
                <Button variant="outline" onClick={handleRetry}>{t("common.reset", "Reset")}</Button>
            </div>
        );
    }

    if (isMobileLayout) {
        return (
            <div ref={containerRef} className="w-full h-full overflow-hidden flex flex-col">
                <ResponsiveLoadingWrapper isLoading={false}>
                    <div className="flex-1 flex flex-col h-full gap-2">
                        <div className="flex-1">
                            <MobileBoardLayout {...props} />
                        </div>
                    </div>
                </ResponsiveLoadingWrapper>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full flex justify-center items-center">
            <ResponsiveLoadingWrapper isLoading={false}>
                <div className="w-full h-full flex flex-col select-none touch-auto">
                    <Board {...props} />
                </div>
            </ResponsiveLoadingWrapper>
        </div>
    );
}

export default memo(ResponsiveBoard);