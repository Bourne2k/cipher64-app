import { createFileRoute } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import {
  boardImageAtom as boardThemeAtom,  // <-- Alias legacy name
  pieceSetAtom as pieceThemeAtom,    // <-- Alias legacy name
  playSoundsAtom,                    // <-- The new one we just created
  soundVolumeAtom as volumeAtom,     // <-- Alias legacy name
  showCoordinatesAtom
} from '@/state/atoms';
import { EngineSettingsCard } from '@/features/engines/components/EngineSettingsCard'; // Removed .tsx extension
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const [boardTheme, setBoardTheme] = useAtom(boardThemeAtom);
  const [pieceTheme, setPieceTheme] = useAtom(pieceThemeAtom);
  const [playSounds, setPlaySounds] = useAtom(playSoundsAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [showCoords, setShowCoords] = useAtom(showCoordinatesAtom);

  // Helper mappings for the UI components
  const isCoordsVisible = showCoords !== 'none';
  const toggleCoords = (checked: boolean) => setShowCoords(checked ? 'inside' : 'none');
  const displayVolume = Math.round(volume * 100); // Convert 0.8 to 80 for Slider

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your Cipher64 preferences and themes.</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="engine">Engine & Coach</TabsTrigger>
        </TabsList>

        {/* --- APPEARANCE TAB --- */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Board Themes</CardTitle>
              <CardDescription>Select your preferred chessboard aesthetic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Board Style</Label>
                  <Select value={boardTheme} onValueChange={setBoardTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue-marble.jpg">Midnight Blue (Premium)</SelectItem>
                      <SelectItem value="wood.jpg">Classic Wood</SelectItem>
                      <SelectItem value="maple.jpg">Light Maple</SelectItem>
                      <SelectItem value="green-plastic.png">Tournament Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Piece Set</Label>
                  <Select value={pieceTheme} onValueChange={setPieceTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pieces" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cburnett">Standard (CBurnett)</SelectItem>
                      <SelectItem value="merida">Merida</SelectItem>
                      <SelectItem value="alpha">Alpha</SelectItem>
                      <SelectItem value="fantasy">Fantasy (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-base">Board Coordinates</Label>
                  <p className="text-sm text-muted-foreground">Show ranks and files on the edge of the board.</p>
                </div>
                {/* Use the mapped boolean functions here */}
                <Switch checked={isCoordsVisible} onCheckedChange={toggleCoords} />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- AUDIO TAB --- */}
        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sound Effects</CardTitle>
              <CardDescription>Configure move and capture sounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Sounds</Label>
                  <p className="text-sm text-muted-foreground">Play sounds during matches and analysis.</p>
                </div>
                <Switch checked={playSounds} onCheckedChange={setPlaySounds} />
              </div>

              <div className="space-y-4 rounded-lg border p-4 shadow-sm">
                <div className="flex justify-between">
                  <Label className="text-base">Master Volume</Label>
                  <span className="text-sm text-muted-foreground">{displayVolume}%</span>
                </div>
                {/* Use the mapped volume here */}
                <Slider
                  disabled={!playSounds}
                  value={[displayVolume]}
                  onValueChange={(val) => setVolume(val[0] / 100)}
                  max={100}
                  step={1}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ENGINE & COACH TAB  --- */}
        <TabsContent value="engine" className="space-y-4">
          <EngineSettingsCard />
        </TabsContent>

      </Tabs>
    </div>
  );
}