import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// STRICT TYPED BINDINGS IMPORT
import { commands, events, type BestMoves } from "@/bindings/generated";

export function BestMovesCard({ currentFen }: { currentFen: string }) {
  // Engine State
  const [engineName] = useState("Stockfish 16.1"); // Can be wired to a global settings store later
  const [depth, setDepth] = useState(0);
  const [targetDepth] = useState(24);
  const [nps, setNps] = useState(0);
  const [lines, setLines] = useState<BestMoves[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    const tabId = "analysis-tab-main";
    const engineId = "analysis-1";

    // 1. CLEAR PREVIOUS STATE ON NEW FEN
    setLines([]);
    setDepth(0);

    // 2. DISPATCH COMMAND TO RUST
    // Using strict Specta types: GoMode and EngineOptions
    commands.getBestMoves(
      engineId,
      engineName,
      tabId,
      { t: "Depth", c: targetDepth },
      { fen: currentFen, moves: [], extraOptions: [] }
    ).catch(err => console.error("Failed to start engine:", err));

    // 3. LISTEN TO RUST EVAL STREAM
    const unlistenPromise = events.bestMovesPayload.listen(({ payload }) => {
      if (!isSubscribed) return;

      // Strict FEN check: prevent race conditions from delayed streams of old positions
      if (payload.fen !== currentFen) return;

      if (payload.bestLines && payload.bestLines.length > 0) {
        setDepth(payload.bestLines[0].depth);
        setNps(payload.bestLines[0].nps);
        setLines(payload.bestLines);
      }
    });

    // 4. CLEANUP: Stop engine when component unmounts or FEN changes
    return () => {
      isSubscribed = false;
      commands.stopEngine(engineName, tabId).catch(console.error);
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [currentFen, engineName, targetDepth]);

  // UI calculations
  const progress = Math.min((depth / targetDepth) * 100, 100);
  const formatNps = (nodes: number) => nodes > 1000000 ? `${(nodes / 1000000).toFixed(1)}M` : `${(nodes / 1000).toFixed(1)}k`;

  return (
    <Card className="h-full flex flex-col shadow-sm border-border/50">
      {/* HEADER */}
      <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Bot className={`w-4 h-4 ${depth > 0 && depth < targetDepth ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
          <CardTitle className="text-sm font-semibold tracking-tight">{engineName}</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            {nps > 0 ? `${formatNps(nps)} nps` : 'Idle'}
          </span>
          <span className="text-[11px] font-medium font-mono bg-muted px-2 py-0.5 rounded-sm">
            D {depth}/{targetDepth}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>

      {/* DEPTH PROGRESS BAR */}
      <div className="h-[2px] w-full bg-muted">
        <Progress value={progress} className="h-full rounded-none bg-blue-500 transition-all duration-300" />
      </div>

      {/* LINES & EVALUATION OUTPUT */}
      <CardContent className="p-0 flex-1 overflow-hidden bg-background">
        <ScrollArea className="h-full">
          <div className="flex flex-col divide-y divide-border/40">
            {lines.length === 0 ? (
              <div className="p-6 text-xs text-muted-foreground/60 text-center animate-pulse font-medium">
                Evaluating position...
              </div>
            ) : lines.map((line, idx) => {

              const isBest = idx === 0;
              const scoreType = line.score.value.type;
              const rawScore = line.score.value.value;

              // Calculate Centipawn / Mate strings
              const isMate = scoreType === "mate";
              const scoreDisplay = isMate
                ? `M${Math.abs(rawScore)}`
                : `${rawScore > 0 ? '+' : ''}${(rawScore / 100).toFixed(2)}`;

              // Map WDL (Win/Draw/Loss) into percentages if provided (Stockfish returns per-mille, e.g., 1000 total)
              let wdlBar = null;
              if (line.score.wdl) {
                const [w, d, l] = line.score.wdl;
                const total = w + d + l || 1;
                const pW = (w / total) * 100;
                const pD = (d / total) * 100;
                const pL = (l / total) * 100;

                wdlBar = (
                  <div className="flex h-1.5 w-full rounded-full overflow-hidden opacity-80 mt-1.5 shadow-inner">
                    <div style={{ width: `${pW}%` }} className="bg-emerald-500" title={`Win: ${pW.toFixed(1)}%`} />
                    <div style={{ width: `${pD}%` }} className="bg-slate-400" title={`Draw: ${pD.toFixed(1)}%`} />
                    <div style={{ width: `${pL}%` }} className="bg-rose-500" title={`Loss: ${pL.toFixed(1)}%`} />
                  </div>
                );
              }

              return (
                <div key={idx} className={`flex items-start gap-3 p-3 transition-colors ${isBest ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>

                  {/* Left Column: Score Badge & WDL Graph */}
                  <div className="flex flex-col items-center shrink-0 w-[4.5rem]">
                    <Badge variant={isBest ? "default" : "secondary"} className={`font-mono text-[11px] w-full justify-center shadow-sm ${isMate ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600' : ''}`}>
                      {scoreDisplay}
                    </Badge>
                    {wdlBar}
                  </div>

                  {/* Right Column: Engine Continuation (SAN) */}
                  <div className="text-[13px] font-medium text-foreground/80 leading-relaxed font-mono tracking-tight pt-0.5">
                    {line.sanMoves && line.sanMoves.length > 0
                      ? line.sanMoves.join(' ')
                      : line.uciMoves.join(' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}