import { createFileRoute } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { open } from '@tauri-apps/plugin-dialog';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderOpen, Monitor, SlidersHorizontal, Volume2, HardDrive, Cpu } from 'lucide-react';

// Features
import { EngineSettingsCard } from '@/features/engines/components/EngineSettingsCard';

// Core State Atoms mapped from PawnAppetit
import {
  boardImageAtom, pieceSetAtom, showCoordinatesAtom, blindfoldAtom, moveMethodAtom, showDestsAtom, autoPromoteAtom, eraseDrawablesOnClickAtom,
  showArrowsAtom, snapArrowsAtom, showConsecutiveArrowsAtom, moveNotationTypeAtom, previewBoardOnHoverAtom, enableBoardScrollAtom,
  soundVolumeAtom, soundCollectionAtom, storedDocumentDirAtom, autoSaveAtom, percentageCoverageAtom, minimumGamesAtom, practiceAnimationSpeedAtom
} from '@/state/atoms';

// Mapped assets from PawnAppetit public folder
const boardImages = ["blue-marble.jpg", "wood.jpg", "maple.jpg", "green-plastic.png", "purple.svg", "newspaper.svg", "ic.svg", "green.svg", "gray.svg", "brown.svg", "blue.svg", "wood4.jpg", "wood3.jpg", "wood2.jpg", "purple-diag.png", "olive.jpg", "pink-pyramid.png", "metal.jpg", "marble.jpg", "maple2.jpg", "leather.jpg", "grey.jpg", "horsey.jpg", "blue3.jpg", "canvas2.jpg", "blue2.jpg"];
const pieceSets = ["alpha", "anarcandy", "california", "cardinal", "cburnett", "chess7", "chessnut", "companion", "disguised", "dubrovny", "fantasy", "fresca", "gioco", "governor", "horsey", "icpieces", "kosal", "leipzig", "letter", "libra", "maestro", "merida", "pirouetti", "pixel", "reillycraig", "riohacha", "shapes", "spatial", "staunty", "tatiana"];
const soundCollections = ["futuristic", "lisp", "nes", "piano", "robot", "sfx", "standard", "woodland"];

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
});

// A premium wrapper for each setting
function SettingRow({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 shadow-sm transition-colors hover:bg-muted/10">
      <div className="space-y-1.5 pr-6">
        <Label className="text-sm font-semibold">{title}</Label>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsPage() {
  // --- STATE BINDINGS ---
  const [boardImage, setBoardImage] = useAtom(boardImageAtom);
  const [pieceSet, setPieceSet] = useAtom(pieceSetAtom);
  const [showCoordinates, setShowCoordinates] = useAtom(showCoordinatesAtom);
  const [blindfold, setBlindfold] = useAtom(blindfoldAtom);
  const [moveMethod, setMoveMethod] = useAtom(moveMethodAtom);
  const [showDests, setShowDests] = useAtom(showDestsAtom);
  const [autoPromote, setAutoPromote] = useAtom(autoPromoteAtom);
  const [eraseDrawables, setEraseDrawables] = useAtom(eraseDrawablesOnClickAtom);

  const [showArrows, setShowArrows] = useAtom(showArrowsAtom);
  const [snapArrows, setSnapArrows] = useAtom(snapArrowsAtom);
  const [consecutiveArrows, setConsecutiveArrows] = useAtom(showConsecutiveArrowsAtom);
  const [moveNotation, setMoveNotation] = useAtom(moveNotationTypeAtom);
  const [previewHover, setPreviewHover] = useAtom(previewBoardOnHoverAtom);
  const [scrollMoves, setScrollMoves] = useAtom(enableBoardScrollAtom);
  const [practiceSpeed, setPracticeSpeed] = useAtom(practiceAnimationSpeedAtom);

  const [volume, setVolume] = useAtom(soundVolumeAtom);
  const [soundCollection, setSoundCollection] = useAtom(soundCollectionAtom);

  const [docDir, setDocDir] = useAtom(storedDocumentDirAtom);
  const [autoSave, setAutoSave] = useAtom(autoSaveAtom);
  const [minGames, setMinGames] = useAtom(minimumGamesAtom);
  const [coverage, setCoverage] = useAtom(percentageCoverageAtom);

  // --- ACTIONS ---
  const handleBrowseDirectory = async () => {
    try {
      const selected = await open({ multiple: false, directory: true, title: "Select Cipher64 Database Folder" });
      if (selected && typeof selected === 'string') {
        setDocDir(selected);
      }
    } catch (err) {
      console.error("Failed to open dialog", err);
    }
  };

  const displayVolume = Math.round(volume * 100);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10 h-[calc(100vh-3rem)] flex flex-col bg-background overflow-hidden">

      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm">Manage your comprehensive Cipher64 workspace preferences.</p>
      </div>

      <Tabs defaultValue="gameplay" className="flex flex-col md:flex-row gap-8 lg:gap-12 flex-1 overflow-hidden">

        {/* --- SIDEBAR NAVIGATION --- */}
        <TabsList className="flex flex-col h-auto w-full md:w-56 shrink-0 items-start justify-start space-y-2 bg-transparent p-0">
          <TabsTrigger value="gameplay" className="w-full justify-start gap-3 px-4 py-3 text-[13px] font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md border border-transparent data-[state=active]:border-primary/20 transition-all"><Monitor className="h-4 w-4" /> Board & Gameplay</TabsTrigger>
          <TabsTrigger value="visuals" className="w-full justify-start gap-3 px-4 py-3 text-[13px] font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md border border-transparent data-[state=active]:border-primary/20 transition-all"><SlidersHorizontal className="h-4 w-4" /> Visuals & Assist</TabsTrigger>
          <TabsTrigger value="audio" className="w-full justify-start gap-3 px-4 py-3 text-[13px] font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md border border-transparent data-[state=active]:border-primary/20 transition-all"><Volume2 className="h-4 w-4" /> Audio & Sound</TabsTrigger>
          <TabsTrigger value="engine" className="w-full justify-start gap-3 px-4 py-3 text-[13px] font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md border border-transparent data-[state=active]:border-primary/20 transition-all"><Cpu className="h-4 w-4" /> Engine & Analysis</TabsTrigger>
          <TabsTrigger value="system" className="w-full justify-start gap-3 px-4 py-3 text-[13px] font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md border border-transparent data-[state=active]:border-primary/20 transition-all"><HardDrive className="h-4 w-4" /> System & Data</TabsTrigger>
        </TabsList>

        {/* --- SETTINGS CONTENT --- */}
        <div className="flex-1 overflow-hidden bg-muted/10 rounded-xl border border-border/50 shadow-inner">
          <ScrollArea className="h-full px-6 py-6 lg:px-10 lg:py-8">

            {/* 1. BOARD & GAMEPLAY */}
            <TabsContent value="gameplay" className="space-y-6 m-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">Board & Gameplay</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure your core playing environment and piece behaviors.</p>
              </div>
              <div className="grid gap-3 max-w-3xl">
                <SettingRow title="Board Theme" description="Select the visual background of the chessboard.">
                  <Select value={boardImage} onValueChange={setBoardImage}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent><ScrollArea className="h-[200px]">{boardImages.map(img => <SelectItem key={img} value={img}>{img.split('.')[0]}</SelectItem>)}</ScrollArea></SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="Piece Set" description="Choose the style of the chess pieces.">
                  <Select value={pieceSet} onValueChange={setPieceSet}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent><ScrollArea className="h-[200px]">{pieceSets.map(set => <SelectItem key={set} value={set} className="capitalize">{set}</SelectItem>)}</ScrollArea></SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="Board Coordinates" description="Show algebraic ranks and files on the board.">
                  <Select value={showCoordinates} onValueChange={(val: any) => setShowCoordinates(val)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Hidden</SelectItem>
                      <SelectItem value="inside">Inside Board</SelectItem>
                      <SelectItem value="all">Outside Edge</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="Move Method" description="How you prefer to move pieces.">
                  <Select value={moveMethod} onValueChange={(val: any) => setMoveMethod(val)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drag">Drag & Drop Only</SelectItem>
                      <SelectItem value="select">Click to Move Only</SelectItem>
                      <SelectItem value="both">Both Allowed</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="Show Valid Destinations" description="Highlight legal squares when a piece is selected.">
                  <Switch checked={showDests} onCheckedChange={setShowDests} />
                </SettingRow>
                <SettingRow title="Auto-Queen Promotion" description="Automatically promote pawns to Queens to save time.">
                  <Switch checked={autoPromote} onCheckedChange={setAutoPromote} />
                </SettingRow>
                <SettingRow title="Blindfold Mode" description="Hide all pieces to practice your visualization skills.">
                  <Switch checked={blindfold} onCheckedChange={setBlindfold} />
                </SettingRow>
                <SettingRow title="Erase Drawables on Click" description="Clear custom arrows and circles when clicking the board.">
                  <Switch checked={eraseDrawables} onCheckedChange={setEraseDrawables} />
                </SettingRow>
              </div>
            </TabsContent>

            {/* 2. VISUALS & ASSIST */}
            <TabsContent value="visuals" className="space-y-6 m-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">Visuals & Assist</h2>
                <p className="text-sm text-muted-foreground mt-1">Customize analytical drawing tools and interface feedback.</p>
              </div>
              <div className="grid gap-3 max-w-3xl">
                <SettingRow title="Show Engine Arrows" description="Display calculated best moves directly on the board.">
                  <Switch checked={showArrows} onCheckedChange={setShowArrows} />
                </SettingRow>
                <SettingRow title="Snap Arrows" description="Force manual arrows to snap perfectly to square centers.">
                  <Switch checked={snapArrows} onCheckedChange={setSnapArrows} />
                </SettingRow>
                <SettingRow title="Consecutive Arrows" description="Allow drawing a sequence of arrows (A->B, B->C) easily.">
                  <Switch checked={consecutiveArrows} onCheckedChange={setConsecutiveArrows} />
                </SettingRow>
                <SettingRow title="Move Notation Style" description="Display notation using standard letters or unicode symbols.">
                  <Select value={moveNotation} onValueChange={(val: any) => setMoveNotation(val)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letters">Letters (Nf3)</SelectItem>
                      <SelectItem value="symbols">Symbols (♞f3)</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="Preview Board on Hover" description="Peek at historical positions by hovering over moves in notation.">
                  <Switch checked={previewHover} onCheckedChange={setPreviewHover} />
                </SettingRow>
                <SettingRow title="Scroll Through Moves" description="Use mouse wheel over the board to quickly navigate history.">
                  <Switch checked={scrollMoves} onCheckedChange={setScrollMoves} />
                </SettingRow>
                <SettingRow title="Practice Animation Speed" description="Set the speed of piece movement during practice lessons.">
                  <Select value={practiceSpeed} onValueChange={(val: any) => setPracticeSpeed(val)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Instant</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="slow">Slow</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </div>
            </TabsContent>

            {/* 3. AUDIO & SOUND */}
            <TabsContent value="audio" className="space-y-6 m-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">Audio & Sound</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure the auditory feedback for game events.</p>
              </div>
              <div className="grid gap-3 max-w-3xl">
                <SettingRow title="Sound Collection" description="Choose the sound pack used for moves and captures.">
                  <Select value={soundCollection} onValueChange={setSoundCollection}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {soundCollections.map(sound => <SelectItem key={sound} value={sound} className="capitalize">{sound}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow title="Master Volume" description="Adjust the overall volume of sound effects.">
                  <div className="flex items-center gap-4 w-[180px]">
                    <Slider value={[displayVolume]} onValueChange={(val) => setVolume(val[0] / 100)} min={0} max={100} step={1} />
                    <span className="text-[13px] font-mono w-10 text-right">{displayVolume}%</span>
                  </div>
                </SettingRow>
              </div>
            </TabsContent>

            {/* 4. ENGINE & ANALYSIS */}
            <TabsContent value="engine" className="space-y-6 m-0 max-w-3xl">
              <div className="mb-2">
                <h2 className="text-xl font-bold tracking-tight">Engine & Analysis</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage local UCI executables and allocate system resources.</p>
              </div>
              {/* Uses the robust component we fixed in Phase 1 */}
              <EngineSettingsCard />
            </TabsContent>

            {/* 5. SYSTEM & DATA */}
            <TabsContent value="system" className="space-y-6 m-0">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">System & Data</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage local file storage, databases, and analytical parameters.</p>
              </div>
              <div className="grid gap-3 max-w-3xl">
                <SettingRow title="File Directory" description="The root folder on your hard drive where PGNs and databases are stored.">
                  <div className="flex items-center gap-2 max-w-[250px]">
                    <span className="text-[11px] font-mono text-muted-foreground bg-background px-2 py-1.5 border rounded truncate shadow-sm" title={docDir || "Not selected"}>
                      {docDir || "Select a folder..."}
                    </span>
                    <Button variant="secondary" size="sm" onClick={handleBrowseDirectory} className="shadow-sm"><FolderOpen className="w-4 h-4 mr-2" /> Browse</Button>
                  </div>
                </SettingRow>
                <SettingRow title="Auto-Save Games" description="Automatically save locally played games to your primary database.">
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </SettingRow>
                <SettingRow title="Report Coverage %" description="Target percentage for variations analyzed in opening reports.">
                  <div className="flex items-center gap-4 w-[180px]">
                    <Slider value={[coverage]} onValueChange={(val) => setCoverage(val[0])} min={50} max={100} step={1} />
                    <span className="text-[13px] font-mono w-10 text-right">{coverage}%</span>
                  </div>
                </SettingRow>
                <SettingRow title="Minimum Games" description="Minimum occurrences required for a line to appear in opening reports.">
                  <div className="flex items-center gap-4 w-[180px]">
                    <Slider value={[minGames]} onValueChange={(val) => setMinGames(val[0])} min={0} max={100} step={1} />
                    <span className="text-[13px] font-mono w-10 text-right">{minGames}</span>
                  </div>
                </SettingRow>
              </div>
            </TabsContent>

          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}