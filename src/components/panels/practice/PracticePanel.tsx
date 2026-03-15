import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Target, Play, RotateCcw } from "lucide-react";

import { TreeStateContext } from "@/components/TreeStateContext";
import { Button } from "@/components/ui/button";

export default function PracticePanel() {
    const { t } = useTranslation();
    const store = useContext(TreeStateContext);
    if (!store) return null;

    // Assuming you have practice state hooks or context here
    // For UI migration, we will build the shell and wire the standard buttons
    const isPracticing = false; // Replace with your actual practice state hook
    const cardsDue = 12; // Mock data
    const totalCards = 150; // Mock data

    const startPractice = () => {
        // Implement start logic
    };

    const stopPractice = () => {
        // Implement stop logic
    };

    return (
        <div className="flex flex-col h-full bg-card border border-border/50 rounded-md overflow-hidden p-4 items-center justify-center text-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <Target className="w-6 h-6" />
            </div>

            <div>
                <h3 className="text-lg font-bold">{t("features.practice.spacedRepetition", "Spaced Repetition")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("features.practice.cardsDue", { count: cardsDue, total: totalCards }, `${cardsDue} moves due for review out of ${totalCards}`)}
                </p>
            </div>

            <div className="w-full h-px bg-border/50 my-2" />

            {isPracticing ? (
                <Button variant="destructive" className="w-full font-bold shadow-sm" onClick={stopPractice}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t("common.stop", "Stop Practice")}
                </Button>
            ) : (
                <Button className="w-full font-bold shadow-sm" onClick={startPractice} disabled={cardsDue === 0}>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    {t("features.practice.start", "Start Session")}
                </Button>
            )}
        </div>
    );
}