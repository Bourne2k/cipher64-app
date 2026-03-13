import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

// Our beautiful new components
import { Chessground } from '@/components/Chessground';
import { EvalBar } from '@/features/boards/components/EvalBar';
import { MoveControls } from '@/features/boards/components/MoveControls';
import { GameNotation } from '@/features/boards/components/GameNotation';
import { GameHeader } from '@/features/boards/components/GameHeader';

import { CoachBubble } from '@/features/coach/CoachBubble';
import { BestMovesCard } from '@/features/engines/components/BestMovesCard';
import { EngineSettingsCard } from '@/features/engines/components/EngineSettingsCard';

// Shadcn UI primitives
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Play, Bot } from 'lucide-react';

// 1. MUST EXPORT ROUTE for TanStack Router to work
export const Route = createFileRoute('/play')({
  component: PlayPage,
});

function PlayPage() {
  // 2. State for the board
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isPremium] = useState(true);

  return (
    <div className="flex h-full w-full gap-4 p-4 overflow-hidden bg-background">

      {/* --- LEFT COLUMN: The Board & Eval Bar --- */}
      <div className="flex-1 flex items-center justify-center p-4 gap-4 h-full overflow-hidden min-w-[300px]">
        {/* Eval Bar Container */}
        <div className="h-full max-h-[85vh] py-0">
          <EvalBar score={1.2} />
        </div>

        {/* Board Container */}
        <div className="w-full max-w-[85vh] aspect-square flex-shrink-0 shadow-2xl ring-1 ring-border/50 rounded-sm overflow-hidden relative">
          {/* 3. FIX: Properly passing FEN and setFen to our updated Chessground */}
          <Chessground 
            fen={fen} 
            setBoardFen={setFen}
            movable={{ color: 'both', free: true }} 
          />
        </div>
      </div>

      {/* --- RIGHT COLUMN: Tabbed Control Panel --- */}
      <div className="w-[400px] flex flex-col gap-4 border-l border-border pl-4 bg-muted/10 h-full">
        <Tabs defaultValue="play" className="flex flex-col h-full w-full overflow-hidden">

          <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-lg p-1">
            <TabsTrigger value="play" className="text-sm font-semibold tracking-wide">
              Play & Notation
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-sm font-semibold tracking-wide">
              Engine Analysis
            </TabsTrigger>
          </TabsList>

          {/* PLAY TAB */}
          <TabsContent value="play" className="flex-1 flex flex-col gap-3 mt-4 h-full overflow-hidden">
            <GameHeader />
            <div className="flex gap-2 w-full">
              <Button variant="secondary" className="flex-1 shadow-sm font-semibold">
                <Play className="mr-2 h-4 w-4" /> Start Game
              </Button>
            </div>
            <GameNotation />
            <MoveControls />
            <div className="mt-2 flex-shrink-0">
              <CoachBubble
                isPremium={isPremium}
                data={{
                  type: 'mistake',
                  concepts: ['pin', 'development'],
                  explanation: "Playing Nf6 here allows White to pressure your center immediately with Ng5. Notice how the evaluation jumped in White's favor."
                }}
              />
            </div>
          </TabsContent>

          {/* ANALYSIS TAB */}
          <TabsContent value="analysis" className="flex-1 flex flex-col gap-4 mt-4 h-full overflow-y-auto pr-1">
            <div className="flex gap-2 mb-2 w-full">
              <Button variant="default" className="flex-1 shadow-md bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                <Bot className="mr-2 h-4 w-4" /> Start AI Coach Analysis
              </Button>
            </div>

            <div className="flex-1 min-h-[250px] shadow-sm">
              {/* 4. FIX: Passing the currentFen to the Engine card so Rust doesn't crash */}
              <BestMovesCard currentFen={fen} />
            </div>

            <div className="flex-shrink-0 mb-4 shadow-sm">
              <EngineSettingsCard />
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}