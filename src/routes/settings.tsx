import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme-provider";
import { Monitor, Moon, Sun, Palette, Settings2, Keyboard, Cpu, Hash, Save } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export const Route = createFileRoute('/settings')({
    component: SettingsPage,
})

function SettingsPage() {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{t("settings.title", "Settings")}</h1>
                <p className="text-muted-foreground mt-2">
                    {t("settings.description", "Manage your app preferences, themes, and engine configurations.")}
                </p>
            </div>

            <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px] mb-8">
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Appearance
                    </TabsTrigger>
                    <TabsTrigger value="engine" className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" /> Engine
                    </TabsTrigger>
                    <TabsTrigger value="shortcuts" className="flex items-center gap-2">
                        <Keyboard className="w-4 h-4" /> Shortcuts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Theme</CardTitle>
                            <CardDescription>Select the color mode for the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <div
                                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-md border-2 cursor-pointer hover:bg-muted/50 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="w-8 h-8 mb-2" />
                                <span className="font-medium text-sm">Light</span>
                            </div>
                            <div
                                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-md border-2 cursor-pointer hover:bg-muted/50 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="w-8 h-8 mb-2" />
                                <span className="font-medium text-sm">Dark</span>
                            </div>
                            <div
                                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-md border-2 cursor-pointer hover:bg-muted/50 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="w-8 h-8 mb-2" />
                                <span className="font-medium text-sm">System</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="engine" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stockfish 16.1 Defaults</CardTitle>
                            <CardDescription>Configure the global defaults for local UCI engines.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base flex items-center gap-2"><Cpu className="w-4 h-4" /> CPU Threads</Label>
                                    <p className="text-sm text-muted-foreground">Number of CPU threads allocated to the engine.</p>
                                </div>
                                <div className="w-[200px] flex items-center gap-4">
                                    <Slider defaultValue={[4]} max={32} min={1} step={1} />
                                    <span className="font-mono text-sm font-bold w-4 text-right">4</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base flex items-center gap-2"><Hash className="w-4 h-4" /> Hash Size (MB)</Label>
                                    <p className="text-sm text-muted-foreground">Memory allocated for engine transposition tables.</p>
                                </div>
                                <Select defaultValue="1024">
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="256">256 MB</SelectItem>
                                        <SelectItem value="512">512 MB</SelectItem>
                                        <SelectItem value="1024">1024 MB</SelectItem>
                                        <SelectItem value="2048">2048 MB</SelectItem>
                                        <SelectItem value="4096">4096 MB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Use NNUE Evaluation</Label>
                                    <p className="text-sm text-muted-foreground">Enable Neural Network based evaluation (highly recommended).</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border/50 py-3 flex justify-end">
                            <Button><Save className="w-4 h-4 mr-2" /> Save Engine Config</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="shortcuts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyboard Shortcuts</CardTitle>
                            <CardDescription>Customize global keybindings for the workspace.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { action: "Next Move", key: "ArrowRight" },
                                { action: "Previous Move", key: "ArrowLeft" },
                                { action: "Toggle Blindfold", key: "B" },
                                { action: "Flip Board", key: "F" },
                                { action: "Toggle Engine Eval", key: "E" }
                            ].map((shortcut) => (
                                <div key={shortcut.action} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
                                    <span className="text-sm font-medium">{shortcut.action}</span>
                                    <Input className="w-24 text-center font-mono text-xs uppercase bg-background" readOnly value={shortcut.key} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}