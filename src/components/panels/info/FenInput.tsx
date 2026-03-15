import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { Copy, ClipboardPaste, Check } from "lucide-react";
import { toast } from "sonner";

import { TreeStateContext } from "@/components/TreeStateContext";

// Shadcn UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function FenInput({ currentFen }: { currentFen?: string }) {
    const { t } = useTranslation();
    const [value, setValue] = useState(currentFen || "");
    const [copied, setCopied] = useState(false);

    const store = useContext(TreeStateContext);
    // Safely grab setFen if we are inside the tree context (allows read-only usage elsewhere)
    const setFen = store ? useStore(store, (s: any) => s.setFen) : undefined;

    // Sync the input text when the external FEN changes
    useEffect(() => {
        if (currentFen) setValue(currentFen);
    }, [currentFen]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(t("common.copied", "Copied to clipboard"));
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error(t("common.copyFailed", "Failed to copy"));
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setValue(text.trim());
                if (setFen) {
                    setFen(text.trim());
                    toast.success(t("common.pasted", "Position loaded from clipboard"));
                }
            }
        } catch (err) {
            toast.error(t("common.pasteFailed", "Failed to paste"));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && setFen) {
            setFen(value.trim());
            toast.success(t("features.board.editor.fenUpdated", "Position updated"));
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2 w-full">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("features.board.editor.fenPlaceholder", "Paste FEN string here...")}
                    className="font-mono text-[11px] h-9 flex-1 bg-muted/30"
                    title="Press Enter to load position"
                />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 shadow-sm" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("common.copy", "Copy FEN")}</TooltipContent>
                </Tooltip>

                {setFen && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 shadow-sm" onClick={handlePaste}>
                                <ClipboardPaste className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.paste", "Paste & Load FEN")}</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}