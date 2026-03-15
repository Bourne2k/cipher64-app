import type { Color } from "@lichess-org/chessground/types";
import { useTranslation } from "react-i18next";
import { type SquareName, makeSquare } from "chessops";
import { squareToCoordinates } from "@/utils/chessops";

// Shadcn UI
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Map standard NAG annotations to their symbols and colors
const annotationMap: Record<string, { color: string; label: string; bg: string; text: string }> = {
  "!": { color: "text-emerald-500", bg: "bg-emerald-500", text: "!", label: "Good move" },
  "?": { color: "text-amber-500", bg: "bg-amber-500", text: "?", label: "Mistake" },
  "!!": { color: "text-blue-500", bg: "bg-blue-500", text: "!!", label: "Brilliant move" },
  "??": { color: "text-red-500", bg: "bg-red-500", text: "??", label: "Blunder" },
  "!?": { color: "text-purple-500", bg: "bg-purple-500", text: "!?", label: "Interesting move" },
  "?!": { color: "text-orange-500", bg: "bg-orange-500", text: "?!", label: "Dubious move" },
  "□": { color: "text-slate-500", bg: "bg-slate-500", text: "□", label: "Only move" },
};

export default function AnnotationHint({
  annotation,
  square,
  orientation,
}: {
  annotation: string;
  square: SquareName;
  orientation: Color;
}) {
  const { t } = useTranslation();
  if (!annotationMap[annotation]) return null;

  const { file, rank } = squareToCoordinates(makeSquare(square)!, orientation);
  const data = annotationMap[annotation];

  return (
    <div
      className="absolute z-10 pointer-events-auto"
      style={{
        width: "12.5%",
        height: "12.5%",
        left: `${(file - 1) * 12.5}%`,
        bottom: `${(rank - 1) * 12.5}%`,
      }}
    >
      <div className="relative w-full h-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md ring-2 ring-white cursor-help",
                  data.bg
                )}
              >
                {data.text}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{t(`chess.annotations.${data.label.replace(' ', '')}`, data.label)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}