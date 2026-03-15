import { memo, useContext } from "react";
import { useStore } from "zustand";
import { TreeStateContext } from "@/components/TreeStateContext";
import type { Opening } from "@/utils/db";

function OpeningsTable({ openings, loading }: { openings: Opening[]; loading: boolean }) {
    const store = useContext(TreeStateContext);
    if (!store) throw new Error("TreeStateContext not found");

    const makeMove = useStore(store, (s) => s.makeMove);

    const whiteTotal = openings?.reduce((acc, curr) => acc + curr.white, 0) || 0;
    const blackTotal = openings?.reduce((acc, curr) => acc + curr.black, 0) || 0;
    const drawTotal = openings?.reduce((acc, curr) => acc + curr.draw, 0) || 0;
    const grandTotal = whiteTotal + blackTotal + drawTotal;

    let displayOpenings = openings || [];

    if (displayOpenings.length > 0) {
        displayOpenings = [
            ...displayOpenings,
            {
                move: "Total",
                white: whiteTotal,
                black: blackTotal,
                draw: drawTotal,
            },
        ];
    }

    return (
        <div className="flex flex-col w-full h-full border border-border rounded-md overflow-hidden bg-card text-card-foreground">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm text-muted-foreground z-10 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 font-medium w-[100px]">Move</th>
                            <th className="px-4 py-3 font-medium w-[180px]">Total</th>
                            <th className="px-4 py-3 font-medium">Results</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading && displayOpenings.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                    Loading...
                                </td>
                            </tr>
                        ) : displayOpenings.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                    No games found
                                </td>
                            </tr>
                        ) : (
                            displayOpenings.map((record, i) => {
                                const total = record.white + record.draw + record.black;
                                const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

                                const whitePercent = total > 0 ? (record.white / total) * 100 : 0;
                                const drawPercent = total > 0 ? (record.draw / total) * 100 : 0;
                                const blackPercent = total > 0 ? (record.black / total) * 100 : 0;

                                const isTotalRow = i === displayOpenings.length - 1;

                                return (
                                    <tr
                                        key={`${record.move}-${i}`}
                                        className={`transition-colors cursor-pointer hover:bg-muted/50 ${isTotalRow ? "sticky bottom-0 bg-muted/90 backdrop-blur-sm font-bold border-t-2 border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10" : ""
                                            }`}
                                        onClick={() => {
                                            if (!isTotalRow && record.move !== "*") {
                                                makeMove({ payload: record.move });
                                            }
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            {record.move === "*" ? (
                                                <span className="italic text-muted-foreground">Game end</span>
                                            ) : (
                                                <span>{record.move}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                {record.move !== "Total" && (
                                                    <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                                                )}
                                                <span className="text-right flex-1">{total.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 min-w-[200px]">
                                            {total > 0 && (
                                                <div className="flex w-full h-6 overflow-hidden rounded-md font-medium text-xs shadow-sm">
                                                    {whitePercent > 0 && (
                                                        <div
                                                            className="bg-[#f0f0f0] text-black flex items-center justify-center border-r border-background/20"
                                                            style={{ width: `${whitePercent}%` }}
                                                        >
                                                            {whitePercent > 10 ? `${whitePercent.toFixed(1)}%` : ""}
                                                        </div>
                                                    )}
                                                    {drawPercent > 0 && (
                                                        <div
                                                            className="bg-[#a0a0a0] text-white flex items-center justify-center border-r border-background/20"
                                                            style={{ width: `${drawPercent}%` }}
                                                        >
                                                            {drawPercent > 10 ? `${drawPercent.toFixed(1)}%` : ""}
                                                        </div>
                                                    )}
                                                    {blackPercent > 0 && (
                                                        <div
                                                            className="bg-[#303030] text-white flex items-center justify-center"
                                                            style={{ width: `${blackPercent}%` }}
                                                        >
                                                            {blackPercent > 10 ? `${blackPercent.toFixed(1)}%` : ""}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default memo(OpeningsTable);