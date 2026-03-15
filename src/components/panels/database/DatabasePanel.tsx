import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { Database, Search } from "lucide-react";

import { TreeStateContext } from "@/components/TreeStateContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock data structure - hook this up to your actual local SQLite / Lichess API later
const MOCK_MOVES = [
  { san: "e4", games: 1245000, white: 33, draw: 41, black: 26 },
  { san: "d4", games: 890000, white: 35, draw: 43, black: 22 },
  { san: "Nf3", games: 450000, white: 32, draw: 45, black: 23 },
  { san: "c4", games: 320000, white: 34, draw: 42, black: 24 },
];

export default function DatabasePanel() {
  const { t } = useTranslation();
  const store = useContext(TreeStateContext);
  if (!store) return null;

  const currentNode = useStore(store, (s) => s.currentNode());
  const makeMove = useStore(store, (s: any) => s.makeMove); // Assuming your store has this

  const handleMoveClick = (san: string) => {
    // Implement standard SAN move execution
    // makeMove({ payload: parseSan(pos, san) }) 
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border/50 rounded-md overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
          <Database className="w-4 h-4 text-primary" />
          {t("features.database.explorer", "Opening Explorer")}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
          Master Games
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center px-3 py-1.5 bg-muted/10 border-b border-border/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
        <div className="w-16">{t("common.move", "Move")}</div>
        <div className="w-20 text-right pr-4">{t("common.games", "Games")}</div>
        <div className="flex-1 text-center">{t("features.database.result", "Result")}</div>
      </div>

      {/* Scrollable Moves List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {MOCK_MOVES.map((move) => (
            <div 
              key={move.san} 
              className="flex items-center px-3 py-2 border-b border-border/30 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleMoveClick(move.san)}
            >
              <div className="w-16 font-mono font-bold text-[13px]">{move.san}</div>
              <div className="w-20 text-right pr-4 text-[12px] text-muted-foreground">
                {move.games.toLocaleString()}
              </div>
              
              {/* Win/Draw/Loss Bar */}
              <div className="flex-1 h-4 flex rounded-sm overflow-hidden border border-border/50 opacity-90">
                <div 
                  className="bg-white/90 dark:bg-white/80 h-full flex items-center justify-center text-[9px] font-bold text-black"
                  style={{ width: `${move.white}%` }}
                >
                  {move.white > 15 && `${move.white}%`}
                </div>
                <div 
                  className="bg-slate-400 h-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ width: `${move.draw}%` }}
                >
                  {move.draw > 15 && `${move.draw}%`}
                </div>
                <div 
                  className="bg-black/80 h-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ width: `${move.black}%` }}
                >
                  {move.black > 15 && `${move.black}%`}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State / Loading State mapping would go here */}
          {MOCK_MOVES.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="w-6 h-6 mb-2 opacity-50" />
              <span className="text-sm">{t("features.database.noMovesFound", "No moves found in database.")}</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}