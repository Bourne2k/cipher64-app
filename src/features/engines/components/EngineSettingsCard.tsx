import { useAtom } from 'jotai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu, HardDrive, ListTree, Zap } from 'lucide-react';

// NOTE: Ensure these atom names match exactly what you copied into src/state/atoms.ts
// If they differ slightly in your copied pawnappetit state, just rename the imports!
import {
    engineHashAtom,
    engineThreadsAtom,
    engineMultiPvAtom,
    activeEngineIdAtom
} from '@/state/atoms';

export function EngineSettingsCard() {
    const [hashSize, setHashSize] = useAtom(engineHashAtom);
    const [threads, setThreads] = useAtom(engineThreadsAtom);
    const [multiPv, setMultiPv] = useAtom(engineMultiPvAtom);
    const [activeEngine, setActiveEngine] = useAtom(activeEngineIdAtom);

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Engine Configuration
                </CardTitle>
                <CardDescription>
                    Allocate system resources for Stockfish and the AI Coach.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Engine Selection */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        Primary Engine
                    </Label>
                    <Select value={activeEngine} onValueChange={setActiveEngine}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Engine" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="stockfish-16.1">Stockfish 16.1 (Built-in)</SelectItem>
                            <SelectItem value="stockfish-16">Stockfish 16 (AVX2)</SelectItem>
                            <SelectItem value="custom">Custom UCI Engine...</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Threads / Cores Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            Threads (Cores)
                        </Label>
                        <span className="text-sm font-mono text-muted-foreground">{threads}</span>
                    </div>
                    <Slider
                        value={[threads]}
                        onValueChange={(val) => setThreads(val[0])}
                        min={1}
                        max={16} // You can dynamically set this using navigator.hardwareConcurrency later
                        step={1}
                        className="py-1"
                    />
                </div>

                {/* Hash Size (RAM) Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            Hash Size (MB)
                        </Label>
                        <span className="text-sm font-mono text-muted-foreground">{hashSize} MB</span>
                    </div>
                    <Slider
                        value={[hashSize]}
                        onValueChange={(val) => setHashSize(val[0])}
                        min={16}
                        max={4096}
                        step={16}
                        className="py-1"
                    />
                </div>

                {/* MultiPV / Lines Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <ListTree className="h-4 w-4 text-muted-foreground" />
                            Analysis Lines (MultiPV)
                        </Label>
                        <span className="text-sm font-mono text-muted-foreground">{multiPv}</span>
                    </div>
                    <Slider
                        value={[multiPv]}
                        onValueChange={(val) => setMultiPv(val[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="py-1"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Higher values show more alternative moves but reduce calculation depth.
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}