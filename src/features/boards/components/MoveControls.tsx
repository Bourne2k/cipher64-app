import { useAtom } from 'jotai';
import { boardOrientationAtom } from '@/state/atoms';
import { Button } from '@/components/ui/button';
import {
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    FlipVertical
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MoveControls() {
    const [orientation, setOrientation] = useAtom(boardOrientationAtom);

    const handleFlip = () => {
        setOrientation(prev => prev === 'white' ? 'black' : 'white');
    };
    return (
        <div className="flex w-full items-center justify-between rounded-md border border-border bg-muted/30 p-1 shadow-sm">
            <TooltipProvider delayDuration={300}>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                      <Button variant="outline" size="icon" onClick={handleFlip} title="Flip Board">
                <FlipVertical className="w-4 h-4" />
            </Button>
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <FlipVertical className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Flip Board</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        
    );
}
