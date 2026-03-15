import { useContext, useMemo, useState, useEffect } from "react";
import { useStore } from "zustand";
import { parseSquare, parseUci } from "chessops";
import { chessgroundDests } from "chessops/compat";

// State & Utils
import { TreeStateContext } from "@/components/TreeStateContext";
import { positionFromFen } from "@/utils/chessops";
import { commands } from "@/bindings/generated";

// UI Components
import { Chessground } from "@/components/Chessground";
import { EvalBar } from "./EvalBar";
import { GameNotation } from "./GameNotation";
import { GameHeader } from "./GameHeader";
import { MoveControls } from "./MoveControls";

// Shadcn
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, RotateCcw, ShieldAlert, X } from "lucide-react";

type GameStatus = 'setup' | 'playing' | 'gameover';

export default function BoardGame() {
    const store = useContext(TreeStateContext);
    if (!store) return <div className="p-4 text-destructive font-bold">TreeStateContext missing.</div>;

    const currentNode = useStore(store, (s) => s.currentNode());
    const makeMove = useStore(store, (s) => s.makeMove);
    const resetTree = useStore(store, (s: any) => s.reset);

    const fen = currentNode.fen;
    const [pos] = useMemo(() => positionFromFen(fen), [fen]);
    const turn = pos?.turn || 'white';
    const isGameOver = pos?.isEnd() || false;

    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
    const [actualPlayerColor, setActualPlayerColor] = useState<'white' | 'black'>('white');
    const [isEngineThinking, setIsEngineThinking] = useState(false);

    // Monitor for Game Over
    useEffect(() => {
        if (isGameOver && gameStatus === 'playing') setGameStatus('gameover');
    }, [isGameOver, gameStatus]);

    // Engine Interaction Loop
    useEffect(() => {
        if (gameStatus !== 'playing' || isGameOver) return;
        const isEngineTurn = turn !== actualPlayerColor;

        if (isEngineTurn) {
            let isActive = true;
            const fetchEngineMove = async () => {
                setIsEngineThinking(true);
                try {
                    const result = await commands.getBestMoves(
                        "play-session", "Stockfish 16.1", "play-tab",
                        { t: "Depth", c: 15 },
                        { fen: fen, moves: [], extraOptions: [] }
                    );
                    if (!isActive) return;
                    if (result.status === "ok" && result.data) {
                        const bestMoves = result.data[1];
                        if (bestMoves.length > 0 && bestMoves[0].uciMoves.length > 0) {
                            const parsedMove = parseUci(bestMoves[0].uciMoves[0]);
                            if (parsedMove) makeMove({ payload: { from: parsedMove.from, to: parsedMove.to, promotion: parsedMove.promotion } });
                        }
                    }
                } catch (e) {
                    console.error("Engine failed", e);
                } finally {
                    if (isActive) setIsEngineThinking(false);
                }
            };
            const timer = setTimeout(fetchEngineMove, 400);
            return () => {
                isActive = false;
                clearTimeout(timer);
                commands.stopEngine("Stockfish 16.1", "play-tab").catch(console.error);
            };
        }
    }, [turn, gameStatus, isGameOver, actualPlayerColor, fen, makeMove]);

    const dests = useMemo(() => {
        if (!pos || gameStatus !== 'playing' || turn !== actualPlayerColor) return new Map();
        return chessgroundDests(pos);
    }, [pos, gameStatus, turn, actualPlayerColor]);

    const handleStartGame = () => {
        if (resetTree) resetTree();
        setGameStatus('playing');
    };

    const handleAbortGame = () => {
        commands.stopEngine("Stockfish 16.1", "play-tab").catch(console.error);
        setGameStatus('setup');
        if (resetTree) resetTree();
    };

    return (
        <div className="flex h-full w-full gap-4 p-4 overflow-hidden bg-background">
            {/* Board Column */}
            <div className="flex-1 flex items-center justify-center p-4 gap-4 h-full">
                {gameStatus !== 'setup' && (
                    <div className="h-full max-h-[85vh] py-0">
                        <EvalBar score={currentNode.score?.value ?? null} orientation={actualPlayerColor} />
                    </div>
                )}
                <div className={`w-full max-w-[85vh] aspect-square shadow-2xl ring-1 ring-border/50 rounded-sm overflow-hidden transition-all ${gameStatus === 'setup' ? 'opacity-50 blur-[2px]' : 'opacity-100'}`}>
                    <Chessground
                        fen={fen}
                        orientation={actualPlayerColor}
                        turnColor={turn}
                        animation={{ enabled: true, duration: 250 }}
                        movable={{
                            color: actualPlayerColor,
                            free: false,
                            dests: dests,
                            events: {
                                after: (orig, dest) => {
                                    const from = parseSquare(orig);
                                    const to = parseSquare(dest);
                                    if (from !== undefined && to !== undefined) {
                                        let promotion;
                                        if (pos && pos.board.get(from)?.role === 'pawn' && (dest[1] === '8' || dest[1] === '1')) promotion = 'queen';
                                        makeMove({ payload: { from, to, promotion } });
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Controls Column */}
            <div className="w-[350px] flex flex-col gap-4 border-l border-border pl-4 bg-muted/5 h-full">
                {gameStatus === 'setup' ? (
                    <Card className="shadow-sm border-border mt-10">
                        <CardContent className="pt-6 space-y-4">
                            <div className="text-center space-y-1 mb-6">
                                <Bot className="w-8 h-8 mx-auto text-primary mb-2" />
                                <h2 className="font-bold text-lg">Play vs Computer</h2>
                                <p className="text-xs text-muted-foreground">Select side and start match.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant={actualPlayerColor === 'white' ? 'default' : 'outline'} onClick={() => setActualPlayerColor('white')}>White</Button>
                                <Button variant={actualPlayerColor === 'black' ? 'default' : 'outline'} onClick={() => setActualPlayerColor('black')}>Black</Button>
                            </div>
                            <Button className="w-full font-bold h-12 mt-4" onClick={handleStartGame}>Start Match</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        <GameHeader />
                        <GameNotation />
                        <MoveControls />

                        {gameStatus === 'gameover' ? (
                            <div className="mt-4 space-y-2 bg-primary/10 p-4 rounded-lg border border-primary/20 text-center">
                                <ShieldAlert className="w-6 h-6 mx-auto text-primary mb-2" />
                                <p className="font-bold text-primary mb-4">Match Concluded</p>
                                <Button className="w-full" onClick={handleAbortGame}><RotateCcw className="w-4 h-4 mr-2" /> New Game</Button>
                            </div>
                        ) : (
                            <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-destructive" onClick={handleAbortGame}>
                                <X className="w-4 h-4 mr-2" /> Abort Match
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}