import { parseSquare } from "chessops";
import { EMPTY_BOARD_FEN, makeFen, parseFen } from "chessops/fen";
import { useAtom } from "jotai";
import { useRef, useState } from "react";
import type { Piece as PieceType } from "@lichess-org/chessground/types";

import { Chessground } from "@/components/Chessground";
import PiecesGrid from "@/features/boards/components/PiecesGrid";
import { PlayerSearchInput } from "@/features/databases/components/PlayerSearchInput";
import { currentLocalOptionsAtom } from "@/state/atoms";
import { formatDateToPGN } from "@/utils/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Native replacement for Mantine SegmentedControl
function SegmentControl({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
}) {
    return (
        <div className="flex bg-muted p-1 rounded-md items-center h-9">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 text-sm px-3 py-1 rounded-sm transition-all whitespace-nowrap ${value === opt.value
                            ? "bg-background shadow-sm text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function LocalOptionsPanel({ boardFen }: { boardFen: string }) {
    const boardRef = useRef<HTMLDivElement>(null);
    const [options, setOptions] = useAtom(currentLocalOptionsAtom);
    const [selectedPiece, setSelectedPiece] = useState<PieceType | null>(null);

    const setSimilarStructure = async (fen: string) => {
        const setup = parseFen(fen).unwrap();
        for (const square of setup.board.pawn.complement()) {
            setup.board.take(square);
        }
        const fenResult = makeFen(setup);
        setOptions((q) => ({ ...q, type: "partial", fen: fenResult }));
    };

    return (
        <div className="flex flex-col gap-6 p-1 text-card-foreground">
            {/* Search & Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-center gap-2">
                        <Label className="font-bold whitespace-nowrap">Player:</Label>
                        {options.path && (
                            <div className="w-48">
                                <PlayerSearchInput
                                    label="Search..."
                                    value={options.player ?? undefined}
                                    file={options.path}
                                    setValue={(v) => setOptions((q) => ({ ...q, player: v || null }))}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="font-bold whitespace-nowrap">Color:</Label>
                        <SegmentControl
                            value={options.color}
                            onChange={(v) => setOptions({ ...options, color: v as "white" | "black" })}
                            options={[
                                { value: "white", label: "White" },
                                { value: "black", label: "Black" },
                            ]}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="font-bold whitespace-nowrap">Result:</Label>
                        <Select
                            value={options.result}
                            onValueChange={(v) =>
                                setOptions({
                                    ...options,
                                    result: v as "any" | "whitewon" | "draw" | "blackwon",
                                })
                            }
                        >
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                <SelectItem value="whitewon">White won</SelectItem>
                                <SelectItem value="draw">Draw</SelectItem>
                                <SelectItem value="blackwon">Black won</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Input
                                type="date"
                                className="h-9"
                                title="Start Date"
                                value={options.start_date ? options.start_date.replace(/\./g, "-") : ""}
                                onChange={(e) =>
                                    setOptions({
                                        ...options,
                                        start_date: e.target.value ? formatDateToPGN(e.target.value) : undefined,
                                    })
                                }
                            />
                        </div>
                        <span className="text-muted-foreground">-</span>
                        <div className="flex flex-col gap-1.5">
                            <Input
                                type="date"
                                className="h-9"
                                title="End Date"
                                value={options.end_date ? options.end_date.replace(/\./g, "-") : ""}
                                onChange={(e) =>
                                    setOptions({
                                        ...options,
                                        end_date: e.target.value ? formatDateToPGN(e.target.value) : undefined,
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Position Match Type */}
            <div className="flex items-center gap-2">
                <Label className="font-bold whitespace-nowrap">Position:</Label>
                <SegmentControl
                    value={options.type}
                    onChange={(v) => setOptions({ ...options, type: v as "exact" | "partial" })}
                    options={[
                        { value: "exact", label: "Exact" },
                        { value: "partial", label: "Partial" },
                    ]}
                />
            </div>

            {/* Board Editor & Pieces */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex flex-col gap-4">
                    <div ref={boardRef} className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] shrink-0 border border-border shadow-sm rounded-sm overflow-hidden">
                        <Chessground
                            fen={options.fen}
                            coordinates={false}
                            lastMove={[]}
                            movable={{
                                free: true,
                                color: "both",
                                events: {
                                    after: (orig, dest) => {
                                        const setup = parseFen(options.fen).unwrap();
                                        const p = setup.board.take(parseSquare(orig)!)!;
                                        setup.board.set(parseSquare(dest)!, p);
                                        setOptions((q) => ({ ...q, fen: makeFen(setup) }));
                                    },
                                },
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setOptions((q) => ({ ...q, type: "exact", fen: boardFen }));
                            }}
                        >
                            Current Position
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSimilarStructure(boardFen);
                            }}
                        >
                            Similar Structure
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setOptions((q) => ({
                                    ...q,
                                    type: "partial",
                                    fen: EMPTY_BOARD_FEN,
                                }));
                            }}
                        >
                            Empty
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col flex-1 w-full max-w-[320px]">
                    <PiecesGrid
                        boardRef={boardRef}
                        fen={options.fen}
                        onPut={(newFen) => {
                            setOptions((q) => ({ ...q, fen: newFen }));
                        }}
                        orientation={options.color === "black" ? "black" : "white"}
                        selectedPiece={selectedPiece}
                        setSelectedPiece={setSelectedPiece}
                    />
                </div>
            </div>
        </div>
    );
}

export default LocalOptionsPanel;