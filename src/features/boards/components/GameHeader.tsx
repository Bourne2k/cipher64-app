import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerProps {
    name: string;
    rating?: number;
    isBlack?: boolean;
    isActive?: boolean;
}

function PlayerTag({ name, rating, isBlack, isActive }: PlayerProps) {
    return (
        <div className={cn(
            "flex flex-1 items-center gap-2 rounded-md p-2 transition-colors border",
            isActive ? "bg-accent border-primary/50 shadow-sm" : "bg-card border-transparent opacity-70"
        )}>
            <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded shadow-inner",
                isBlack ? "bg-[#2b2b2b] text-white" : "bg-[#f3f3f3] text-black"
            )}>
                <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">{name}</span>
                {rating && <span className="text-[10px] text-muted-foreground font-mono mt-1">Elo {rating}</span>}
            </div>
        </div>
    );
}

export function GameHeader() {
    return (
        <div className="flex w-full gap-2 p-1 bg-muted/20 rounded-lg border border-border shadow-sm">
            <PlayerTag name="Stockfish 16" rating={3200} isBlack={true} isActive={false} />
            <div className="flex items-center justify-center px-1 text-xs font-bold text-muted-foreground">
                VS
            </div>
            <PlayerTag name="Pranjal" rating={1500} isBlack={false} isActive={true} />
        </div>
    );
}