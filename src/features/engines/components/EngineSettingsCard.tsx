import { useState } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { open } from '@tauri-apps/plugin-dialog';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Cpu, HardDrive, ListTree, Zap, FolderOpen, Loader2, AlertCircle, Check, X } from 'lucide-react';

// Strict Tauri IPC bindings
import { commands } from '@/bindings/generated';

// Global State
import {
    engineHashAtom,
    engineThreadsAtom,
    engineMultiPvAtom,
    activeEngineIdAtom,
    enginesAtom,
    loadableEnginesAtom
} from '@/state/atoms';

export function EngineSettingsCard() {
    const [hashSize, setHashSize] = useAtom(engineHashAtom);
    const [threads, setThreads] = useAtom(engineThreadsAtom);
    const [multiPv, setMultiPv] = useAtom(engineMultiPvAtom);
    const [activeEngine, setActiveEngine] = useAtom(activeEngineIdAtom);
    
    // Safely read the async atom to prevent Suspense crashes
    const enginesLoadable = useAtomValue(loadableEnginesAtom);
    const setEngines = useSetAtom(enginesAtom);

    const safeEngines = enginesLoadable.state === 'hasData' && Array.isArray(enginesLoadable.data) 
        ? enginesLoadable.data 
        : [];

    // Local UI State
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Inline naming state (Auto-detecting like PawnAppetit)
    const [pendingEngine, setPendingEngine] = useState<{ path: string, name: string, options: any[] } | null>(null);

    const handleBrowseEngine = async () => {
        setIsImporting(true);
        setError(null);

        try {
            // 1. Open Native OS File Explorer
            const selectedPath = await open({
                multiple: false,
                directory: false,
                title: "Select UCI Engine Executable",
                filters: [{ name: 'Executables', extensions: ['exe', 'bin', 'out'] }] 
            });

            if (!selectedPath || typeof selectedPath !== 'string') {
                setIsImporting(false);
                return; // User canceled
            }

            // 2. Validate and Auto-Detect via Rust
            const configResult = await commands.getEngineConfig(selectedPath);

            if (configResult.status === "ok") {
                // Prepare the engine for naming by the user
                setPendingEngine({
                    path: selectedPath,
                    name: configResult.data.name || "Custom UCI Engine",
                    options: configResult.data.options
                });
            } else {
                setError("Failed to parse UCI options. Is this a valid chess engine?");
            }
        } catch (err) {
            console.error("Tauri File Dialog Error:", err);
            setError("Failed to open file explorer or validate engine.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleConfirmAdd = () => {
        if (!pendingEngine) return;

        // Extract default settings based on PawnAppetit's parsing logic
        const settings = pendingEngine.options.map(o => {
            let defaultValue: any = "";
            if (o.type === "check") defaultValue = o.value.default ?? false;
            else if (o.type === "spin") defaultValue = Number(o.value.default ?? 0);
            else if (o.type === "combo" || o.type === "string") defaultValue = o.value.default ?? "";
            
            return { name: o.value.name, value: String(defaultValue) };
        });

        const newEngine = {
            type: "local",
            name: pendingEngine.name, // The user-edited name
            path: pendingEngine.path,
            loaded: true,
            settings: settings 
        };

        // 3. FIX: Safely resolve the Jotai Promise before checking/updating array
        setEngines(async (prevPromise: any) => {
            const prev = await prevPromise;
            const current = Array.isArray(prev) ? prev : [];
            
            // Prevent duplicates
            if (current.some((e: any) => e.path === pendingEngine.path)) {
                return current;
            }
            
            return [...current, newEngine];
        });
        
        setActiveEngine(pendingEngine.path);
        setPendingEngine(null); // Close the inline form
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Engine Configuration
                </CardTitle>
                <CardDescription>
                    Allocate system resources for imported UCI engines.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* --- Engine Selection & Import --- */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        Primary Engine
                    </Label>
                    
                    {/* Inline Form: Auto-detects name, lets user edit before saving */}
                    {pendingEngine ? (
                        <div className="flex gap-2 items-center bg-muted/40 p-2.5 rounded-md border border-border shadow-inner">
                            <div className="flex-1">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block font-semibold">
                                    Name Engine
                                </Label>
                                {/* Using native input with Shadcn tailwind classes to ensure compatibility */}
                                <input 
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={pendingEngine.name}
                                    onChange={e => setPendingEngine({...pendingEngine, name: e.target.value})}
                                    autoFocus
                                    title="Edit engine name"
                                />
                            </div>
                            <div className="flex items-end gap-1 mt-[18px]">
                                <Button variant="default" size="icon" className="h-9 w-9 shadow-sm" onClick={handleConfirmAdd} title="Save Engine">
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50" onClick={() => setPendingEngine(null)} title="Cancel">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">
                            <Select value={activeEngine} onValueChange={setActiveEngine}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={enginesLoadable.state === 'loading' ? 'Loading...' : (safeEngines.length === 0 ? 'No engines installed' : 'Select Engine')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeEngines.length > 0 ? (
                                        <SelectGroup>
                                            <SelectLabel>Local Imported Engines</SelectLabel>
                                            {safeEngines.map((engine) => (
                                                <SelectItem key={engine.path} value={engine.path}>
                                                    {engine.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ) : (
                                        <div className="p-3 text-xs text-muted-foreground font-medium text-center">
                                            No engines found.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>

                            <Button 
                                variant="secondary" 
                                size="icon" 
                                onClick={handleBrowseEngine} 
                                disabled={isImporting || enginesLoadable.state === 'loading'}
                                title="Browse for custom engine .exe"
                            >
                                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-destructive mt-1.5">
                            <AlertCircle className="h-3.5 w-3.5" /> {error}
                        </div>
                    )}
                </div>

                {/* --- System Resource Sliders --- */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                            <Cpu className="h-4 w-4" />
                            Threads (Cores)
                        </Label>
                        <span className="text-sm font-mono font-medium">{threads}</span>
                    </div>
                    <Slider
                        value={[threads]}
                        onValueChange={(val) => setThreads(val[0])}
                        min={1}
                        max={16}
                        step={1}
                        className="py-1"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                            <HardDrive className="h-4 w-4" />
                            Hash Size (MB)
                        </Label>
                        <span className="text-sm font-mono font-medium">{hashSize} MB</span>
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

                <div className="space-y-3 pb-2">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                            <ListTree className="h-4 w-4" />
                            Analysis Lines (MultiPV)
                        </Label>
                        <span className="text-sm font-mono font-medium">{multiPv}</span>
                    </div>
                    <Slider
                        value={[multiPv]}
                        onValueChange={(val) => setMultiPv(val[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="py-1"
                    />
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                        Higher values show more alternative moves but reduce calculation depth and speed.
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}