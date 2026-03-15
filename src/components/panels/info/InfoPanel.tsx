import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { Info, Users, Calendar, Trophy, MapPin } from "lucide-react";

import { TreeStateContext } from "@/components/TreeStateContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import FenInput from "./FenInput"; // We'll make sure this is wired up next if needed!

export default function InfoPanel() {
    const { t } = useTranslation();
    const store = useContext(TreeStateContext);
    if (!store) return null;

    const headers = useStore(store, (s) => s.headers);
    const setHeaders = useStore(store, (s: any) => s.setHeaders);
    const currentFen = useStore(store, (s) => s.currentNode().fen);

    const updateHeader = (key: string, value: string) => {
        setHeaders({ ...headers, [key]: value });
    };

    return (
        <div className="flex flex-col h-full bg-card border border-border/50 rounded-md overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/50 shrink-0 text-sm font-semibold text-foreground/80">
                <Info className="w-4 h-4 text-primary" />
                {t("features.info.gameDetails", "Game Details")}
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">

                    {/* Players */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <div className="w-2 h-2 bg-white border border-border rounded-sm" /> White
                            </Label>
                            <Input
                                value={headers.White || ""}
                                onChange={(e) => updateHeader("White", e.target.value)}
                                placeholder="White Player"
                                className="h-8 text-sm font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <div className="w-2 h-2 bg-black border border-border rounded-sm" /> Black
                            </Label>
                            <Input
                                value={headers.Black || ""}
                                onChange={(e) => updateHeader("Black", e.target.value)}
                                placeholder="Black Player"
                                className="h-8 text-sm font-semibold"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border/50 w-full" />

                    {/* Event Details */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> Event
                            </Label>
                            <Input
                                value={headers.Event || ""}
                                onChange={(e) => updateHeader("Event", e.target.value)}
                                placeholder="Event Name"
                                className="h-8 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Site
                                </Label>
                                <Input
                                    value={headers.Site || ""}
                                    onChange={(e) => updateHeader("Site", e.target.value)}
                                    placeholder="Location"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Date
                                </Label>
                                <Input
                                    value={headers.Date || ""}
                                    onChange={(e) => updateHeader("Date", e.target.value)}
                                    placeholder="YYYY.MM.DD"
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Result</Label>
                            <Input
                                value={headers.Result || ""}
                                onChange={(e) => updateHeader("Result", e.target.value)}
                                placeholder="1-0, 0-1, 1/2-1/2, *"
                                className="h-8 text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border/50 w-full" />

                    {/* FEN String */}
                    <div className="space-y-1.5 pb-2">
                        <Label className="text-xs text-muted-foreground">Current FEN</Label>
                        <Input
                            readOnly
                            value={currentFen}
                            className="h-8 text-[11px] font-mono bg-muted/30 text-muted-foreground"
                        />
                    </div>

                </div>
            </ScrollArea>
        </div>
    );
}