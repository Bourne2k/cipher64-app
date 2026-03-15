import { ReactNode } from "react";
import { GameNotation } from "./GameNotation";

// Shadcn UI
import { Card, CardContent } from "@/components/ui/card";

interface GameNotationWrapperProps {
    topBar?: boolean;
    editingMode?: boolean;
    editingCard?: ReactNode;
    children?: ReactNode;
}

export default function GameNotationWrapper({
    topBar = false,
    editingMode = false,
    editingCard,
    children,
}: GameNotationWrapperProps) {

    // This wrapper ensures the notation list takes up the exact remaining height
    // in the react-mosaic bottom-right window pane.
    return (
        <div className="flex flex-col h-full bg-card border-l border-border/50">
            {/* Optional Topbar for mobile/compact views */}
            {topBar && (
                <div className="h-0 shrink-0" /> // Can be expanded with Shadcn headers if needed
            )}

            {/* Editing Mode Overlay */}
            {editingMode && editingCard ? (
                <div className="p-4 flex-1 overflow-y-auto">
                    {editingCard}
                </div>
            ) : (
                <Card className="flex-1 flex flex-col border-none shadow-none rounded-none bg-transparent overflow-hidden">
                    <CardContent className="p-0 flex-1 flex flex-col h-full overflow-hidden">

                        {/* The actual notation list */}
                        <div className="flex-1 min-h-0 relative">
                            <GameNotation />
                        </div>

                        {/* Bottom Controls (Move Controls, Puzzle buttons, etc) */}
                        {children && (
                            <div className="shrink-0 border-t border-border/50 p-2 bg-muted/10">
                                {children}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}