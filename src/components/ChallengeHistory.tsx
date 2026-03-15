import { Check, X, MoreHorizontal } from "lucide-react";
import { useAtomValue } from "jotai";
import { match } from "ts-pattern";
import { hidePuzzleRatingAtom } from "@/state/atoms";
import type { Completion } from "@/utils/puzzles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Challenge = {
    completion: Completion;
    label?: string;
};

export default function ChallengeHistory({
    challenges,
    select,
    current,
}: {
    challenges: Challenge[];
    select: (i: number) => void;
    current: number;
}) {
    const hideRating = useAtomValue(hidePuzzleRatingAtom);

    return (
        <div className="flex flex-wrap items-center gap-2">
            {challenges.map((p, i) => {
                const isCurrent = i === current;

                return match(p.completion)
                    .with("correct", () => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => select(i)}
                                className={cn(
                                    "h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700",
                                    isCurrent && "ring-2 ring-emerald-500 ring-offset-1 ring-offset-background"
                                )}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-emerald-600">{p.label}</span>
                        </div>
                    ))
                    .with("incorrect", () => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => select(i)}
                                className={cn(
                                    "h-8 w-8 rounded-md bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 hover:text-rose-700",
                                    isCurrent && "ring-2 ring-rose-500 ring-offset-1 ring-offset-background"
                                )}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-rose-600">{p.label}</span>
                        </div>
                    ))
                    .with("incomplete", () => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => select(i)}
                                className={cn(
                                    "h-8 w-8 rounded-md bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700",
                                    isCurrent && "ring-2 ring-amber-500 ring-offset-1 ring-offset-background"
                                )}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-amber-600">
                                {hideRating ? "?" : p.label}
                            </span>
                        </div>
                    ))
                    .exhaustive();
            })}
        </div>
    );
}