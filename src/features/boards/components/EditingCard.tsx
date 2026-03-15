import type { Piece } from "@lichess-org/chessground/types";
import { useContext } from "react";
import { useStore } from "zustand";
import { X } from "lucide-react";

import { TreeStateContext } from "@/components/TreeStateContext";
// Note: Ensure FenInput and PiecesGrid are ported/available at these paths
import FenInput from "@/components/panels/info/FenInput"; 
import PiecesGrid from "./PiecesGrid";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EditingCard({
  boardRef,
  setEditingMode,
  selectedPiece,
  setSelectedPiece,
}: {
  boardRef: React.MutableRefObject<HTMLDivElement | null>;
  setEditingMode: (editing: boolean) => void;
  selectedPiece: Piece | null;
  setSelectedPiece: (piece: Piece | null) => void;
}) {
  const store = useContext(TreeStateContext);
  if (!store) return null;

  const fen = useStore(store, (s) => s.currentNode().fen);
  const headers = useStore(store, (s) => s.headers);
  const setFen = useStore(store, (s: any) => s.setFen);

  return (
    <Card className="relative overflow-visible shadow-md p-4 border-border/50 bg-card">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground" 
        onClick={() => setEditingMode(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="mt-2">
        <FenInput currentFen={fen} />
      </div>
      
      <div className="h-px w-full bg-border my-4" />
      
      <PiecesGrid
        fen={fen}
        boardRef={boardRef}
        onPut={(newFen) => setFen(newFen)}
        orientation={headers.orientation}
        selectedPiece={selectedPiece}
        setSelectedPiece={setSelectedPiece}
      />
    </Card>
  );
}