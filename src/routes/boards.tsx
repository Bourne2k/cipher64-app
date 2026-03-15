import { createFileRoute } from "@tanstack/react-router";
import BoardsPage from "@/features/boards/BoardsPage";

export const Route = createFileRoute("/boards")({
    component: BoardsPage,
    // If your router context passes loadDirs for the Tauri filesystem, we call it here
    loader: async ({ context }) => {
        if (context && typeof (context as any).loadDirs === 'function') {
            return (context as any).loadDirs();
        }
        return { documentDir: "default/path" };
    },
});