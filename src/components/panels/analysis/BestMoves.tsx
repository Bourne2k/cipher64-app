import { memo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";

// Exported exactly as Board.tsx expects it
export const arrowColors = [
    { strong: "rgba(50, 171, 50, 0.8)", pale: "rgba(50, 171, 50, 0.3)" }, // Green
    { strong: "rgba(33, 150, 243, 0.8)", pale: "rgba(33, 150, 243, 0.3)" }, // Blue
    { strong: "rgba(255, 152, 0, 0.8)", pale: "rgba(255, 152, 0, 0.3)" }, // Orange
    { strong: "rgba(244, 67, 54, 0.8)", pale: "rgba(244, 67, 54, 0.3)" }, // Red
];

interface BestMovesProps {
    lines?: any[];
    depth?: number;
    engineName?: string;
}

function BestMoves({ lines = [], depth = 0, engineName = "Engine" }: BestMovesProps) {
    const { t } = useTranslation();

    if (!lines || lines.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4 text-sm text-muted-foreground italic">
                {t("features.analysis.waitingForEngine", "Waiting for engine evaluation...")}
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden bg-card text-card-foreground">
            {/* Engine Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-3 py-1.5 text-xs font-semibold">
                <span className="truncate">{engineName}</span>
                <span className="text-muted-foreground font-mono">
                    {t("features.analysis.depth", "Depth")}: {depth}
                </span>
            </div>

            {/* Evaluated Lines */}
            <ScrollArea className="flex-1 p-2">
                <div className="flex flex-col gap-1.5">
                    {lines.map((line, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 rounded-sm p-1.5 text-sm hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex w-12 shrink-0 flex-col items-end">
                                <span className={`font-mono font-bold ${line.score > 0 ? "text-emerald-500" : line.score < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                                    {line.score > 0 ? "+" : ""}{(line.score / 100).toFixed(2)}
                                </span>
                            </div>
                            <div className="font-mono text-[13px] leading-relaxed break-words flex-1 text-foreground/90">
                                {line.pv?.slice(0, 10).map((move: string, i: number) => (
                                    <span key={i} className="mr-1.5 inline-block cursor-pointer hover:text-primary">
                                        {move}
                                    </span>
                                ))}
                                {line.pv?.length > 10 && <span className="text-muted-foreground">...</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default memo(BestMoves);