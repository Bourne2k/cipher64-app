import { memo, Suspense, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Database, LineChart, Info, BookOpen, Target, SearchCode } from "lucide-react";

import AnalysisPanel from "@/components/panels/analysis/AnalysisPanel";
import AnnotationPanel from "@/components/panels/annotation/AnnotationPanel";
import DatabasePanel from "@/components/panels/database/DatabasePanel";
import InfoPanel from "@/components/panels/info/InfoPanel";
import GraphPanel from "@/components/panels/practice/GraphPanel";
import PracticePanel from "@/components/panels/practice/PracticePanel";

import { ResponsiveLoadingWrapper } from "@/components/ResponsiveLoadingWrapper";
import { ResponsiveSkeleton } from "@/components/ResponsiveSkeleton";

// Shadcn UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface ResponsiveAnalysisPanelsProps {
    currentTab?: string;
    onTabChange?: (value: string | null) => void;
    isRepertoire?: boolean;
    isPuzzle?: boolean;
    isLoading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

function ResponsiveAnalysisPanels({
    currentTab = "info",
    onTabChange,
    isRepertoire = false,
    isPuzzle = false,
    isLoading = false,
    error = null,
    onRetry,
}: ResponsiveAnalysisPanelsProps) {
    const { t } = useTranslation();
    const [isInitializing, setIsInitializing] = useState(true);
    const [initializationError, setInitializationError] = useState<Error | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const initializePanels = async () => {
            try {
                setIsInitializing(true);
                setInitializationError(null);
                await new Promise((resolve) => setTimeout(resolve, 50));
                setIsInitializing(false);
            } catch (error) {
                setInitializationError(error as Error);
                setIsInitializing(false);
            }
        };
        initializePanels();
    }, []);

    const handleRetry = useCallback(() => {
        setInitializationError(null);
        setIsInitializing(true);
        onRetry?.();
    }, [onRetry]);

    if (isLoading || isInitializing) {
        return (
            <ResponsiveLoadingWrapper isLoading={true}>
                <ResponsiveSkeleton type="default" />
            </ResponsiveLoadingWrapper>
        );
    }

    if (error || initializationError) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4 text-center">
                <div className="text-sm font-medium text-destructive">{t("errors.failedToLoadAnalysisPanels", "Failed to load panels")}</div>
                <Button variant="outline" onClick={handleRetry}>{t("common.reset", "Reset")}</Button>
            </div>
        );
    }

    const analysisContent = (
        <div className="h-full w-full bg-card border-border/50 border relative p-2 overflow-hidden flex flex-col">
            <Tabs
                value={currentTab}
                onValueChange={(val) => onTabChange?.(val)}
                className="flex flex-col h-full w-full"
            >
                <TabsList className="w-full flex shrink-0 overflow-x-auto justify-start bg-muted/50 p-1 mb-2">
                    {isRepertoire && (
                        <TabsTrigger value="practice" className="flex-1 min-w-[100px] gap-2 text-xs">
                            <Target className="h-3 w-3" /> {t("features.board.tabs.practice", "Practice")}
                        </TabsTrigger>
                    )}
                    {isRepertoire && (
                        <TabsTrigger value="graph" className="flex-1 min-w-[100px] gap-2 text-xs">
                            <LineChart className="h-3 w-3" /> {t("features.board.tabs.graph.label", "Graph")}
                        </TabsTrigger>
                    )}
                    {!isPuzzle && (
                        <TabsTrigger value="analysis" className="flex-1 min-w-[100px] gap-2 text-xs">
                            <SearchCode className="h-3 w-3" /> {t("features.board.tabs.analysis", "Analysis")}
                        </TabsTrigger>
                    )}
                    {!isPuzzle && (
                        <TabsTrigger value="database" className="flex-1 min-w-[100px] gap-2 text-xs">
                            <Database className="h-3 w-3" /> {t("features.board.tabs.database", "Database")}
                        </TabsTrigger>
                    )}
                    {!isPuzzle && (
                        <TabsTrigger value="annotate" className="flex-1 min-w-[100px] gap-2 text-xs">
                            <BookOpen className="h-3 w-3" /> {t("features.board.tabs.annotate", "Annotate")}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="info" className="flex-1 min-w-[100px] gap-2 text-xs">
                        <Info className="h-3 w-3" /> {t("features.board.tabs.info", "Info")}
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    {isRepertoire && (
                        <TabsContent value="practice" className="h-full m-0 border-none outline-none">
                            <Suspense><PracticePanel /></Suspense>
                        </TabsContent>
                    )}
                    {isRepertoire && (
                        <TabsContent value="graph" className="h-full m-0 border-none outline-none">
                            <Suspense><GraphPanel /></Suspense>
                        </TabsContent>
                    )}
                    <TabsContent value="info" className="h-full m-0 border-none outline-none">
                        <InfoPanel />
                    </TabsContent>
                    <TabsContent value="database" className="h-full m-0 border-none outline-none">
                        <DatabasePanel />
                    </TabsContent>
                    <TabsContent value="annotate" className="h-full m-0 border-none outline-none">
                        <AnnotationPanel />
                    </TabsContent>
                    <TabsContent value="analysis" className="h-full m-0 border-none outline-none">
                        <Suspense><AnalysisPanel /></Suspense>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );

    return analysisContent;
}

export default memo(ResponsiveAnalysisPanels);