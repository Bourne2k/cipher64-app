import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

type ProgressPayload = {
    id: string;
    progress: number;
    finished: boolean;
};

function DatabaseLoader({ isLoading, tab }: { isLoading: boolean; tab: string | null }) {
    const [progress, setProgress] = useState(0);
    const [_completed, setCompleted] = useState(false);

    useEffect(() => {
        let unlistenFn: (() => void) | null = null;

        async function getProgress() {
            unlistenFn = await listen<ProgressPayload>("search_progress", ({ payload }) => {
                if (payload.id !== tab) return;
                if (payload.finished) {
                    setCompleted(true);
                    setProgress(0);
                    if (unlistenFn) unlistenFn();
                } else {
                    setProgress(payload.progress);
                }
            });
        }

        getProgress();

        return () => {
            if (unlistenFn) unlistenFn();
        };
    }, [tab]);

    const isLoadingFromMemory = isLoading && progress === 0;

    if (!isLoadingFromMemory && progress === 0) return null;

    return (
        <div className="w-full mt-2">
            <Progress
                value={isLoadingFromMemory ? 100 : progress}
                className={`h-1.5 ${isLoadingFromMemory ? "animate-pulse" : ""}`}
            />
        </div>
    );
}

export default DatabaseLoader;