import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconCpu, IconSettings } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

// 1. Correct Import: Use the auto-generated Specta bindings!
import { commands,events } from "@/bindings/generated";

export function BestMovesCard({ currentFen }: { currentFen: string }) {
  const [engineState, setEngineState] = useState({
    name: "Stockfish 16.1", // Ensure this perfectly matches the name in your local engines.json
    depth: 0,
    targetDepth: 24,
    nodesPerSecond: 0,
    lines: [] as any[]
  });

  // Automatically start/stop analysis when FEN changes
  useEffect(() => {
    const tabId = "main-tab"; // Global tab ID for Cipher64

    // 1. Tell Rust to start the UCI engine analysis using the Specta generated command
    commands.getBestMoves(
      "analysis-id",
      engineState.name,
      tabId,
      { t: "Depth", c: engineState.targetDepth }, // GoMode strict type
      { fen: currentFen, moves: [], extraOptions: [] } // EngineOptions strict type
    ).catch(console.error);

    // 2. Listen for the streaming payload from Rust (Tauri v2 event format)
    const unlistenPromise = events.bestMovesPayload.listen(({ payload }) => {
      setEngineState(prev => ({
        ...prev,
        depth: payload.bestLines.length > 0 ? payload.bestLines[0].depth : prev.depth,
        nodesPerSecond: payload.bestLines.length > 0 ? payload.bestLines[0].nps : prev.nodesPerSecond,
        lines: payload.bestLines,
      }));
    });

    // 3. Cleanup: Stop engine when unmounting or changing FEN
    return () => {
      commands.stopEngine(engineState.name, tabId).catch(console.error);
      unlistenPromise.then(unsub => unsub());
    };
  }, [currentFen, engineState.name, engineState.targetDepth]);

  const progress = (engineState.depth / engineState.targetDepth) * 100;

  return (
    <Card className="h-full flex flex-col shadow-sm border-border/50">
      <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <IconCpu className={`w-4 h-4 ${engineState.depth > 0 ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
          <CardTitle className="text-sm font-semibold">{engineState.name}</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            Depth {engineState.depth}/{engineState.targetDepth}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <IconSettings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="h-1 w-full bg-muted">
        <Progress value={progress} className="h-1 rounded-none bg-blue-500/20" />
      </div>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col divide-y divide-border/40">
            {engineState.lines.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground text-center">Waiting for engine...</div>
            ) : engineState.lines.map((line: any, idx: number) => {

              // Safely extract the nested score value based on the Specta bindings
              const scoreVal = line.score.value;
              const scoreDisplay = scoreVal.type === 'cp'
                ? `${scoreVal.value > 0 ? '+' : ''}${(scoreVal.value / 100).toFixed(2)}`
                : `M${scoreVal.value}`;

              const isBest = idx === 0;

              return (
                <div key={idx} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                  <Badge variant={isBest ? "default" : "secondary"} className="font-mono text-xs w-16 justify-center shrink-0">
                    {scoreDisplay}
                  </Badge>
                  <div className="text-sm font-mono text-muted-foreground leading-relaxed line-clamp-2">
                    {/* Prefer Standard Algebraic Notation if Rust calculated it, fallback to raw UCI */}
                    {line.sanMoves?.join(' ') || line.uciMoves?.join(' ')}
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