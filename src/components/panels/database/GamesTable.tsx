import { IconEye, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { memo, useMemo, useState } from "react";
import type { NormalizedGame } from "@/bindings";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import { parseDate } from "@/utils/format";
import { createTab } from "@/utils/tabs";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GameWithAverageElo = NormalizedGame & { averageElo: number | null };

function GamesTable({ games, loading }: { games: NormalizedGame[]; loading: boolean }) {
  const [, setTabs] = useAtom(tabsAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const gamesWithAverageElo = useMemo<GameWithAverageElo[]>(
    () =>
      games.map((game) => {
        const whiteElo = game.white_elo ?? null;
        const blackElo = game.black_elo ?? null;
        let averageElo: number | null = null;

        if (whiteElo !== null && blackElo !== null) {
          averageElo = Math.round((whiteElo + blackElo) / 2);
        } else if (whiteElo !== null) {
          averageElo = whiteElo;
        } else if (blackElo !== null) {
          averageElo = blackElo;
        }

        return { ...game, averageElo };
      }),
    [games],
  );

  const paginatedGames = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return gamesWithAverageElo.slice(start, end);
  }, [gamesWithAverageElo, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(gamesWithAverageElo.length / pageSize));

  return (
    <div className="flex flex-col w-full h-full border border-border rounded-md overflow-hidden bg-card text-card-foreground">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm text-muted-foreground z-10">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium w-12 text-center"></th>
              <th className="px-4 py-3 font-medium">White</th>
              <th className="px-4 py-3 font-medium">Black</th>
              <th className="px-4 py-3 font-medium">Average ELO</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Ply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && gamesWithAverageElo.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : paginatedGames.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No games found
                </td>
              </tr>
            ) : (
              paginatedGames.map((game, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary/80"
                      onClick={() => {
                        createTab({
                          tab: {
                            name: `${game.white} - ${game.black}`,
                            type: "analysis",
                          },
                          setTabs,
                          setActiveTab,
                          pgn: game.moves,
                          headers: game,
                        });
                        navigate({ to: "/boards" });
                      }}
                    >
                      <IconEye size={16} stroke={1.5} />
                    </Button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{game.white}</span>
                      <span className="text-xs text-muted-foreground">{game.white_elo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{game.black}</span>
                      <span className="text-xs text-muted-foreground">{game.black_elo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{game.averageElo ?? "-"}</td>
                  <td className="px-4 py-2">{parseDate(game.date)}</td>
                  <td className="px-4 py-2">{game.result}</td>
                  <td className="px-4 py-2">{game.ply_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">Rows per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {gamesWithAverageElo.length === 0 ? 0 : (page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, gamesWithAverageElo.length)} of {gamesWithAverageElo.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <IconChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              <IconChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GamesTable);