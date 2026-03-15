import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { TreeStateContext } from "@/components/TreeStateContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Standard NAG (Numeric Annotation Glyph) shorthand symbols
const QUICK_NAGS = [
    { symbol: "!", label: "Good", color: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" },
    { symbol: "?", label: "Mistake", color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" },
    { symbol: "!!", label: "Brilliant", color: "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" },
    { symbol: "??", label: "Blunder", color: "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" },
    { symbol: "!?", label: "Interesting", color: "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20" },
    { symbol: "?!", label: "Dubious", color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20" },
    { symbol: "□", label: "Only Move", color: "text-slate-500 bg-slate-500/10 hover:bg-slate-500/20" },
];

export default function AnnotationPanel() {
    const { t } = useTranslation();
    const store = useContext(TreeStateContext);
    if (!store) return null;

    const currentNode = useStore(store, (s) => s.currentNode());
    const setComment = useStore(store, (s: any) => s.setComment);
    const setAnnotation = useStore(store, (s: any) => s.setAnnotation);
    const position = useStore(store, (s) => s.position);

    // Local state for the textarea to prevent lag while typing
    const [localComment, setLocalComment] = useState(currentNode.comment || "");

    // Sync local state when the node changes (e.g., user clicked a different move)
    useEffect(() => {
        setLocalComment(currentNode.comment || "");
    }, [currentNode.comment, position]);

    const handleCommentBlur = () => {
        if (localComment !== currentNode.comment) {
            setComment(position, localComment);
        }
    };

    const handleToggleNag = (symbol: string) => {
        // If the symbol is already active, clicking it again removes it
        const currentAnnotations = currentNode.annotations || [];
        if (currentAnnotations.includes(symbol)) {
            setAnnotation(position, currentAnnotations.filter((a) => a !== symbol));
        } else {
            // Typically, a move only has one primary move evaluation NAG at a time
            // This simple implementation replaces the primary NAG.
            setAnnotation(position, [symbol]);
        }
    };

    const clearAllAnnotations = () => {
        setAnnotation(position, []);
        setLocalComment("");
        setComment(position, "");
    };

    const currentAnnotations = currentNode.annotations || [];

    return (
        <div className="flex flex-col h-full bg-card p-3 gap-4 border border-border/50 rounded-md">

            {/* Quick NAG Buttons */}
            <div className="shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("features.annotation.evaluation", "Evaluation")}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={clearAllAnnotations}
                        disabled={!localComment && currentAnnotations.length === 0}
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t("common.clear", "Clear")}
                    </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {QUICK_NAGS.map(({ symbol, label, color }) => {
                        const isActive = currentAnnotations.includes(symbol);
                        return (
                            <Button
                                key={symbol}
                                variant="outline"
                                size="sm"
                                title={label}
                                onClick={() => handleToggleNag(symbol)}
                                className={cn(
                                    "h-8 w-10 font-bold text-sm transition-all border-border/50 shadow-sm",
                                    isActive
                                        ? `ring-2 ring-offset-1 ring-offset-background border-transparent ${color.split(' ')[0]} ${color.split(' ')[1]}`
                                        : "hover:bg-muted text-foreground/80"
                                )}
                            >
                                {symbol}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Comment Textarea */}
            <div className="flex-1 flex flex-col min-h-[150px]">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    {t("features.annotation.comment", "Comment")}
                </span>

                <Textarea
                    value={localComment}
                    onChange={(e) => setLocalComment(e.target.value)}
                    onBlur={handleCommentBlur}
                    placeholder={t("features.annotation.placeholder", "Add notes, variations, or plans here...")}
                    className="flex-1 resize-none bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed"
                />
            </div>

        </div>
    );
}