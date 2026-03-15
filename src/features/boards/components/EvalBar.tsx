import { cn } from '@/lib/utils';
import { memo } from 'react';

interface EvalBarProps {
    score: number | null;
    mate?: number; 
    orientation?: "white" | "black"; 
}

const EvalBarComponent = ({ score, mate, orientation = "white" }: EvalBarProps) => {
    // Safely handle null scores (assume 0.0 / equal position)
    const safeScore = score ?? 0;
    const isFlipped = orientation === "black";

    // Calculate percentage fill (clamp between 5% and 95% unless mate)
    let percent = 50;

    if (mate !== undefined && mate !== null) {
        percent = mate > 0 ? 100 : 0;
    } else {
        // A standard sigmoid-like curve for chess evaluation
        percent = 50 + (50 * (2 / (1 + Math.exp(-0.4 * safeScore)) - 1));
        percent = Math.max(5, Math.min(95, percent));
    }

    // If board is flipped, invert the bar
    const whiteHeight = isFlipped ? (100 - percent) : percent;

    const displayScore = mate !== undefined && mate !== null
        ? `M${Math.abs(mate)}`
        : Math.abs(safeScore).toFixed(1);

    return (
        <div className="relative flex h-full w-6 flex-col overflow-hidden rounded-sm border border-border bg-[#2b2b2b]">
            {/* White's portion of the bar */}
            <div
                className="w-full bg-[#eaeaea] transition-all duration-500 ease-in-out"
                style={{ height: `${whiteHeight}%` }}
            />

            {/* Score Text */}
            <div
                className={cn(
                    "absolute left-0 right-0 flex justify-center text-[10px] font-bold z-10",
                    percent > 50 ? "bottom-1 text-[#2b2b2b]" : "top-1 text-[#eaeaea]"
                )}
            >
                {displayScore}
            </div>
        </div>
    );
};

// FIX: We now export it BOTH as a named export AND a default export!
export const EvalBar = memo(EvalBarComponent);
export default EvalBar;