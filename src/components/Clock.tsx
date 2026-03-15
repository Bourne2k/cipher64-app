import { memo } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClockProps {
    color: "white" | "black";
    turn: "white" | "black";
    whiteTime?: number;
    blackTime?: number;
}

// Robust time formatter assuming time is passed in milliseconds
function formatTime(time: number) {
    if (time < 0) time = 0;

    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((time % 1000) / 100);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    // Show tenths of a second when time is critically low (< 20 seconds)
    if (totalSeconds < 20) {
        return `00:${seconds.toString().padStart(2, "0")}.${tenths}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function Clock({ color, turn, whiteTime, blackTime }: ClockProps) {
    const time = color === "white" ? whiteTime : blackTime;
    const isActive = turn === color;

    // If there is no clock configured for this game, don't render anything
    if (time === undefined) return null;

    return (
        <div
            className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[13px] tracking-widest font-bold border transition-colors duration-200 select-none",
                isActive
                    ? "bg-primary/10 text-primary border-primary/30 shadow-sm" // Active player's clock
                    : "bg-muted/30 text-muted-foreground/70 border-border/30 opacity-70" // Waiting player's clock
            )}
        >
            <Timer className={cn("w-3.5 h-3.5", isActive ? "animate-pulse" : "")} />
            <span>{formatTime(time)}</span>
        </div>
    );
}

export default memo(Clock);