import { useContext } from "react";
import { useStore } from "zustand";
import { TreeStateContext } from "@/components/TreeStateContext";

// Use the premium components we built in Phase 1
import { BestMovesCard } from "@/features/engines/components/BestMovesCard";
import { EngineSettingsCard } from "@/features/engines/components/EngineSettingsCard";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function AnalysisPanel() {
  const store = useContext(TreeStateContext);
  if (!store) return null;

  // React to the true mathematical state of the board
  const currentNode = useStore(store, (s) => s.currentNode());
  const fen = currentNode.fen;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-[250px] overflow-hidden rounded-md">
        {/* Our Phase 1 BestMovesCard takes the strict FEN and streams UCI evaluation natively */}
        <BestMovesCard currentFen={fen} />
      </div>

      <div className="shrink-0">
        <ScrollArea className="h-full max-h-[300px]">
          {/* Our Phase 1 EngineSettingsCard handles Tauri native OS file picking */}
          <EngineSettingsCard />
        </ScrollArea>
      </div>
    </div>
  );
}