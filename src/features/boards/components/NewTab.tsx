import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Play, LineChart, Puzzle, FileDown } from "lucide-react"; // Replaced Tabler icons
import { tabsAtom } from "@/state/atoms";
import type { Tab } from "@/utils/tabs";

// Shadcn UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewTabHome({ id }: { id: string }) {
    const { t } = useTranslation();
    const [, setTabs] = useAtom(tabsAtom);

    const cards = [
        {
            icon: <Play className="w-12 h-12 text-primary" />,
            title: t("features.tabs.playChess.title", "Play Chess"),
            description: t("features.tabs.playChess.desc", "Play against the local engine."),
            label: t("features.tabs.playChess.button", "Start Game"),
            onClick: () => {
                setTabs((prev: Tab[]) => {
                    const tab = prev.find((t) => t.value === id);
                    if (!tab) return prev;
                    tab.name = "New Game";
                    tab.type = "play";
                    return [...prev];
                });
            },
        },
        {
            icon: <LineChart className="w-12 h-12 text-blue-500" />,
            title: t("features.tabs.analysisBoard.title", "Analysis Board"),
            description: t("features.tabs.analysisBoard.desc", "Analyze positions with Stockfish."),
            label: t("features.tabs.analysisBoard.button", "Analyze"),
            onClick: () => {
                setTabs((prev: Tab[]) => {
                    const tab = prev.find((t) => t.value === id);
                    if (!tab) return prev;
                    tab.name = "Analysis";
                    tab.type = "analysis";
                    return [...prev];
                });
            },
        },
        {
            icon: <Puzzle className="w-12 h-12 text-emerald-500" />,
            title: t("features.tabs.puzzle.title", "Puzzles"),
            description: t("features.tabs.puzzle.desc", "Solve tactical exercises."),
            label: t("features.tabs.puzzle.button", "Solve"),
            onClick: () => {
                setTabs((prev: Tab[]) => {
                    const tab = prev.find((t) => t.value === id);
                    if (!tab) return prev;
                    tab.name = "Puzzles";
                    tab.type = "puzzles";
                    return [...prev];
                });
            },
        },
        {
            icon: <FileDown className="w-12 h-12 text-amber-500" />,
            title: t("features.tabs.importGame.title", "Import Game"),
            description: t("features.tabs.importGame.desc", "Load PGN files or Fen strings."),
            label: t("features.tabs.importGame.button", "Import"),
            onClick: () => {
                // Hook up your Shadcn import dialog state here
                console.log("Open import dialog");
            },
        },
    ];

    return (
        <div className="flex h-full w-full items-center justify-center p-6 bg-muted/10">
            <div className="max-w-5xl w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">New Workspace</h1>
                    <p className="text-muted-foreground mt-2">Select a module to open in this tab.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card) => (
                        <Card key={card.title} className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow border-border/50 bg-card">
                            <CardHeader className="items-center pb-2 pt-8">
                                <div className="p-4 bg-muted/50 rounded-full mb-2">
                                    {card.icon}
                                </div>
                                <CardTitle className="text-lg font-bold mt-2">{card.title}</CardTitle>
                                <CardDescription className="text-center mt-1 h-10">
                                    {card.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto pt-4 pb-6">
                                <Button variant="secondary" className="w-full font-bold shadow-sm" onClick={card.onClick}>
                                    {card.label}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}