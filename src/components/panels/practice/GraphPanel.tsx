import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { LineChart as ChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import { TreeStateContext } from "@/components/TreeStateContext";
import { getVariationLine } from "@/utils/chess";
import { getNodeAtPath } from "@/utils/treeReducer";

export default function GraphPanel() {
    const { t } = useTranslation();
    const store = useContext(TreeStateContext);
    if (!store) return null;

    const root = useStore(store, (s) => s.root);
    const position = useStore(store, (s) => s.position);

    // Derive evaluation data from the current mainline
    const data = useMemo(() => {
        const line = getVariationLine(root, position);
        const points = [];

        let currentPath: number[] = [];
        for (let i = 0; i <= line.length; i++) {
            const node = getNodeAtPath(root, currentPath);
            const score = node.score?.value ?? 0; // Default to 0 if no eval

            // Cap the score for visual clarity (e.g., between -10 and +10)
            const cappedScore = Math.max(-1000, Math.min(1000, score)) / 100;

            points.push({
                move: i,
                score: cappedScore,
                san: node.san || "Start",
            });

            if (i < line.length) {
                currentPath = [...currentPath, 0]; // Assume mainline for graph
            }
        }
        return points;
    }, [root, position]);

    return (
        <div className="flex flex-col h-full bg-card border border-border/50 rounded-md overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/50 shrink-0 text-sm font-semibold text-foreground/80">
                <ChartIcon className="w-4 h-4 text-primary" />
                {t("features.graph.evaluation", "Evaluation Graph")}
            </div>

            <div className="flex-1 w-full p-4 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="move"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={20}
                        />
                        <YAxis
                            domain={[-10, 10]}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                            itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                            labelFormatter={(label) => `Move ${label}`}
                        />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}