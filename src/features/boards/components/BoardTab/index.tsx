import { memo, useState, useRef, useEffect } from "react";
import { match } from "ts-pattern";
import { Play, LineChart, Puzzle, FileDown, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "@/utils/tabs";
import { Button } from "@/components/ui/button";

interface BoardTabProps {
    tab: Tab;
    selected: boolean;
    setActiveTab: (value: string) => void;
    closeTab: (value: string) => void;
    renameTab: (value: string, name: string) => void;
    duplicateTab: (value: string) => void;
}

export const BoardTab = memo(function BoardTab({
    tab,
    selected,
    setActiveTab,
    closeTab,
    renameTab,
    duplicateTab,
}: BoardTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(tab.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSaveRename = () => {
        if (editName.trim()) renameTab(tab.value, editName.trim());
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSaveRename();
        if (e.key === "Escape") {
            setEditName(tab.name);
            setIsEditing(false);
        }
    };

    const TabIcon = match(tab.type)
        .with("play", () => <Play className="h-3.5 w-3.5 text-primary" />)
        .with("analysis", () => <LineChart className="h-3.5 w-3.5 text-blue-500" />)
        .with("puzzles", () => <Puzzle className="h-3.5 w-3.5 text-emerald-500" />)
        .with("new", () => <FileDown className="h-3.5 w-3.5 text-muted-foreground" />)
        .otherwise(() => <FileDown className="h-3.5 w-3.5 text-muted-foreground" />);

    return (
        <div
            onClick={() => !isEditing && setActiveTab(tab.value)}
            onDoubleClick={() => setIsEditing(true)}
            onContextMenu={(e) => {
                e.preventDefault();
                duplicateTab(tab.value);
            }}
            className={cn(
                "group relative flex items-center gap-2 rounded-t-md border-x border-t px-3 py-1.5 text-sm transition-all select-none cursor-pointer max-w-[200px] shrink-0",
                selected
                    ? "bg-background border-border text-foreground shadow-[0_2px_0_0_hsl(var(--background))] z-10" // Active tab blends into background
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <div className="shrink-0">{TabIcon}</div>

            {isEditing ? (
                <input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={handleKeyDown}
                    className="h-5 w-24 bg-background px-1 text-xs outline-none ring-1 ring-primary rounded-sm"
                />
            ) : (
                <span className="truncate text-xs font-medium tracking-tight">
                    {tab.name}
                </span>
            )}

            {/* Action Buttons (visible on hover or if active) */}
            <div className={cn("flex items-center ml-auto pl-2", selected || "opacity-0 group-hover:opacity-100")}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-sm hover:bg-muted-foreground/20 hover:text-foreground text-muted-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.value);
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
});