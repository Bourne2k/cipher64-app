import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Chessground } from '@/components/Chessground';
import { CoachBubble } from '@/features/coach/CoachBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

export const Route = createFileRoute('/')({
  component: PlayPage,
});

// Dummy data for visual testing before we hook up Rust in Phase 4.2
const DUMMY_ANALYSIS = {
  type: 'blunder' as const,
  concepts: ['fork', 'hanging piece'],
  explanation: "You played Bg5, but after Ne4, your Bishop is hanging and your Knight is forked. The engine evaluation dropped from +1.2 to -2.5.",
};

function PlayPage() {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // This will be read from your Jotai Auth Context later
  const [isPremium] = useState(true);
  const [coachData, setCoachData] = useState<any>(null);

  const handleExplainMove = async () => {
    try {
      // Calling our gated Tauri command from Phase 1
      const response = await invoke('get_coach_explanation', {
        fen,
        moveSan: 'Bg5',
        jwt: 'dummy_token'
      });
      toast.success("Analysis complete");
      setCoachData(DUMMY_ANALYSIS); // Set to real data later
    } catch (err) {
      toast.error(String(err));
    }
  };

  return (
    <div className="flex h-full w-full gap-4 p-4 overflow-hidden">

      {/* Left Column: The Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-[400px]">
        <div className="w-full max-w-[800px] aspect-square rounded-md overflow-hidden shadow-2xl ring-1 ring-border">
          <Chessground
            config={{ fen }}
            onInitialize={(api) => {
              // Standard move handler
              api.set({
                events: {
                  move: (orig, dest) => {
                    console.log(`Moved from ${orig} to ${dest}`);
                    // setCoachData(null); // Clear coach on new move
                  }
                }
              });
            }}
          />
        </div>
      </div>

      {/* Right Column: Engine, Notation, and Coach */}
      <div className="w-[350px] flex flex-col gap-4 border-l border-border pl-4 bg-background/50">

        {/* Game Controls */}
        <div className="flex gap-2">
          <Button variant="default" className="flex-1" onClick={() => setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button variant="secondary" className="flex-1">
            <Play className="mr-2 h-4 w-4" /> Engine Play
          </Button>
        </div>

        {/* Notation Area Placeholder */}
        <ScrollArea className="flex-1 border rounded-md bg-card p-4">
          <div className="text-sm text-muted-foreground font-mono">
            1. e4 e5 2. Nf3 Nc6 3. Bc4 <span className="bg-destructive/20 text-destructive font-bold px-1 rounded cursor-pointer">Bg5?</span>
          </div>
        </ScrollArea>

        {/* Premium Coach Panel */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleExplainMove}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            size="lg"
          >
            Explain Move
          </Button>
          <CoachBubble data={coachData} isPremium={isPremium} />
        </div>

      </div>
    </div>
  );
}