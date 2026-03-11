import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Cpu } from 'lucide-react';

// Dummy data for the UI design phase
const DUMMY_LINES = [
  { depth: 24, score: 1.25, pv: 'Nf3 Nc6 Bc4 Bc5 O-O Nf6 d3 d6 c3 a6' },
  { depth: 24, score: 0.95, pv: 'c3 Nf6 d3 d6 O-O a6 Re1 Ba7' },
  { depth: 24, score: 0.80, pv: 'O-O Nf6 d3 d6 c3 a6 Re1 O-O' },
];

export function BestMovesCard() {
  return (
    <div className="flex flex-col h-full rounded-md border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Cpu className="h-4 w-4" />
          <span>Stockfish 16.1</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">Depth 24</Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y divide-border/50">
          {DUMMY_LINES.map((line, idx) => {
            const isWhiteWinning = line.score > 0;
            const scoreText = line.score > 0 ? `+${line.score.toFixed(2)}` : line.score.toFixed(2);

            return (
              <div key={idx} className="flex flex-col px-3 py-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  {/* Score Bubble */}
                  <div className={cn(
                    "flex w-12 items-center justify-center rounded px-1 py-0.5 text-xs font-bold font-mono shadow-sm",
                    isWhiteWinning 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "bg-destructive/20 text-destructive border border-destructive/30"
                  )}>
                    {scoreText}
                  </div>
                  {/* PV Sequence */}
                  <div className="text-sm font-mono text-muted-foreground line-clamp-2 leading-relaxed">
                    {line.pv}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}