import { useState, useContext, useRef, useEffect } from "react";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import { parseSan } from "chessops/san";
import { makeSan } from "chessops/san";

import { TreeStateContext } from "@/components/TreeStateContext";
import { positionFromFen } from "@/utils/chessops";
import type { TreeNode } from "@/utils/treeReducer";

// Shadcn UI
import { Input } from "@/components/ui/input";

export default function MoveInput({ currentNode }: { currentNode: TreeNode }) {
    const { t } = useTranslation();
    const [value, setValue] = useState("");
    const [error, setError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const store = useContext(TreeStateContext);
    if (!store) return null;

    const makeMove = useStore(store, (s) => s.makeMove);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        const [pos] = positionFromFen(currentNode.fen);
        if (!pos) return;

        try {
            const move = parseSan(pos, value.trim());
            if (move) {
                // Sanity check to ensure it's legal
                const san = makeSan(pos, move);
                if (san) {
                    makeMove({ payload: move });
                    setValue("");
                    setError(false);
                    return;
                }
            }
        } catch (err) {
            console.error("Invalid SAN move", err);
        }

        // If we reach here, the move was invalid
        setError(true);
        setTimeout(() => setError(false), 1000);
    };

    // Auto-focus when user types letters (if they aren't in another input)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA"
            ) return;

            if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <form onSubmit={handleSubmit} className="relative w-32 ml-4">
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t("features.board.typeMove", "Type move...")}
                className={`h-8 text-xs font-mono font-bold transition-colors ${error ? "border-destructive ring-destructive/50 text-destructive focus-visible:ring-destructive" : ""
                    }`}
            />
        </form>
    );
}