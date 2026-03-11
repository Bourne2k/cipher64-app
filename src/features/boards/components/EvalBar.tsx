import { cn } from '@/lib/utils';

interface EvalBarProps {
    score: number; // e.g., 1.5 (White is winning) or -2.3 (Black is winning)
    mate?: number; // e.g., 3 (Mate in 3)
    isFlipped?: boolean; // If black is at the bottom
}

export function EvalBar({ score, mate, isFlipped = false }: EvalBarProps) {
    // Calculate percentage fill (clamp between 5% and 95% unless mate)
    let percent = 50;

    if (mate !== undefined) {
        percent = mate > 0 ? 100 : 0;
    } else {
        // A standard sigmoid-like curve for chess evaluation
        // +5 is generally winning (~95%), 0 is equal (50%)
        percent = 50 + (50 * (2 / (1 + Math.exp(-0.4 * score)) - 1));
        percent = Math.max(5, Math.min(95, percent));
    }

    // If board is flipped, invert the bar
    const whiteHeight = isFlipped ? (100 - percent) : percent;

    const displayScore = mate !== undefined
        ? `M${Math.abs(mate)}`
        : Math.abs(score).toFixed(1);

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
}