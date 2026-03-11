import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Swords, Upload, History, Zap, Target, Flame } from 'lucide-react';

// Using your actual Pawn Appetit logic!
import { getPuzzleStats, type PuzzleStats } from '@/utils/puzzleStreak';
import { getRecentGames, type GameRecord } from '@/utils/gameRecords';

export const Route = createFileRoute('/')({
    component: Dashboard,
});

function Dashboard() {
    const [stats, setStats] = useState<PuzzleStats | null>(null);
    const [recentGames, setRecentGames] = useState<GameRecord[]>([]);

    useEffect(() => {
        // Load actual local data from your utils
        const loadData = async () => {
            setStats(getPuzzleStats());
            // Assuming getRecentGames exists in your utils and returns a promise
            try {
                const games = await getRecentGames(5);
                setRecentGames(games || []);
            } catch (e) {
                console.error("Failed to load games", e);
            }
        };

        loadData();

        // Listen to the exact same event your old code used
        const update = () => loadData();
        window.addEventListener("puzzles:updated", update);
        window.addEventListener("games:updated", update);
        return () => {
            window.removeEventListener("puzzles:updated", update);
            window.removeEventListener("games:updated", update);
        };
    }, []);

    return (
        <div className="flex-1 space-y-6 p-8 overflow-y-auto max-w-7xl mx-auto">

            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Command Center</h2>
                    <p className="text-muted-foreground">
                        Local engine online. Analyzing your recent performances.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="shadow-sm">
                        <Upload className="mr-2 h-4 w-4" /> Import PGN
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                {/* Quick Actions */}
                <Card className="col-span-2 shadow-sm bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quick Deployment</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Link to="/play" className="block">
                            <Button className="w-full h-24 flex flex-col gap-2 shadow-md hover:shadow-lg transition-all" variant="default">
                                <Bot className="h-6 w-6" />
                                Play Stockfish + Coach
                            </Button>
                        </Link>
                        <Link to="/play" className="block">
                            <Button className="w-full h-24 flex flex-col gap-2 shadow-sm border-primary/20 hover:border-primary/50 transition-all" variant="outline">
                                <Swords className="h-6 w-6 text-primary" />
                                Analyze Board
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Custom Pure-Tailwind Puzzle Streak Card */}
                <Card className="col-span-2 shadow-sm relative overflow-hidden">
                    {/* Subtle background glow for premium feel */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <div>
                            <CardTitle className="text-lg">Tactics Streak</CardTitle>
                            <CardDescription>Daily puzzle consistency</CardDescription>
                        </div>
                        <Target className="h-5 w-5 text-orange-500" />
                    </CardHeader>

                    <CardContent className="flex items-center gap-8 z-10 relative">
                        {/* Circular Progress Replacement */}
                        <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-8 border-muted">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="40" cy="40" r="40"
                                    className="stroke-orange-500 fill-none transition-all duration-1000 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray={`${(stats?.currentStreak || 0) / (stats?.target || 30) * 251} 251`}
                                    transform="translate(8, 8)"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="flex flex-col items-center">
                                <Flame className="h-5 w-5 text-orange-500 mb-1" />
                                <span className="text-xl font-bold leading-none">{stats?.currentStreak || 0}</span>
                            </div>
                        </div>

                        {/* Custom Bar Chart for the Week */}
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Past 7 Days</p>
                            <div className="flex items-end justify-between h-16 gap-1">
                                {stats?.history.map((day, idx) => {
                                    const heightPercentage = Math.max(10, Math.min(100, (day.solved / 15) * 100)); // Cap at 15 for visual scale
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-1 w-full group">
                                            <div className="w-full bg-muted rounded-t-sm relative flex items-end justify-center h-full overflow-hidden">
                                                <div
                                                    className="w-full bg-orange-500/80 group-hover:bg-orange-500 transition-all rounded-t-sm"
                                                    style={{ height: `${heightPercentage}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono uppercase">{day.day.substring(0, 2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="grid gap-6 md:grid-cols-3">

                {/* Real Game History */}
                <Card className="col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Local Database Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentGames.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                <History className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No locally saved games yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentGames.map((game, i) => (
                                    <div key={game.id || i} className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold">{game.white.name || 'White'} vs {game.black.name || 'Black'}</span>
                                                <span className="text-xs text-muted-foreground font-mono mt-0.5">{game.moves?.length || 0} plies • {new Date(game.date || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="font-mono text-sm font-bold bg-muted px-2 py-1 rounded">
                                            {game.result || '*'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground" asChild>
                            <Link to="/databases">Open Database Explorer</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Coach Insights Placeholder */}
                <Card className="shadow-sm border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Coach Insights
                        </CardTitle>
                        <CardDescription>Analysis pipeline status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-3 bg-card border rounded-md shadow-sm">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-sm font-medium">Stockfish 16 Engine Ready</p>
                            </div>
                            <div className="p-4 bg-background border border-dashed rounded-md text-center">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Play a game or import a PGN to generate personalized tactical insights and mistake analysis.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}