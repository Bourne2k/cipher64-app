import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { memo, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { useStore } from "zustand";
import { TreeStateContext } from "@/components/TreeStateContext";
import {
  currentDbTabAtom,
  currentDbTypeAtom,
  currentLocalOptionsAtom,
  currentTabAtom,
  lichessOptionsAtom,
  masterOptionsAtom,
  referenceDbAtom,
} from "@/state/atoms";
import { type Opening, searchPosition } from "@/utils/db";
import { convertToNormalized, getLichessGames, getMasterGames } from "@/utils/lichess/api";
import type { LichessGamesOptions, MasterGamesOptions } from "@/utils/lichess/explorer";
import DatabaseLoader from "./DatabaseLoader";
import GamesTable from "./GamesTable";
import NoDatabaseWarning from "./NoDatabaseWarning";
import OpeningsTable from "./OpeningsTable";
import LichessOptionsPanel from "./options/LichessOptionsPanel";
import LocalOptionsPanel from "./options/LocalOptionsPanel";
import MasterOptionsPanel from "./options/MastersOptionsPanel";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type DBType =
  | { type: "local"; options: LocalOptions }
  | { type: "lch_all"; options: LichessGamesOptions; fen: string }
  | { type: "lch_master"; options: MasterGamesOptions; fen: string };

export type LocalOptions = {
  path: string | null;
  fen: string;
  type: "exact" | "partial";
  player: number | null;
  color: "white" | "black";
  start_date?: string;
  end_date?: string;
  result: "any" | "whitewon" | "draw" | "blackwon";
  sort?: "id" | "date" | "whiteElo" | "blackElo" | "averageElo" | "ply_count";
  direction?: "asc" | "desc";
};

function sortOpenings(openings: Opening[]) {
  return openings.sort((a, b) => b.black + b.draw + b.white - (a.black + a.draw + a.white));
}

async function fetchOpening(db: DBType, tab: string) {
  return match(db)
    .with({ type: "lch_all" }, async ({ fen, options }) => {
      const data = await getLichessGames(fen, options);
      return {
        openings: data.moves.map((move) => ({
          move: move.san,
          white: move.white,
          black: move.black,
          draw: move.draws,
        })),
        games: await convertToNormalized(data.topGames || data.recentGames || []),
      };
    })
    .with({ type: "lch_master" }, async ({ fen, options }) => {
      const data = await getMasterGames(fen, options);
      return {
        openings: data.moves.map((move) => ({
          move: move.san,
          white: move.white,
          black: move.black,
          draw: move.draws,
        })),
        games: await convertToNormalized(data.topGames || data.recentGames || []),
      };
    })
    .with({ type: "local" }, async ({ options }) => {
      if (!options.path) throw Error("Missing reference database");
      const positionData = await searchPosition(options, tab);
      return {
        openings: sortOpenings(positionData[0]),
        games: positionData[1],
      };
    })
    .exhaustive();
}

// Replaces Mantine's useDebouncedValue hook natively
function useDebouncedValue<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}

function DatabasePanel() {
  const { t } = useTranslation();

  const store = useContext(TreeStateContext)!;
  const fen = useStore(store, (s) => s.currentNode().fen);
  const referenceDatabase = useAtomValue(referenceDbAtom);
  const [debouncedFen] = useDebouncedValue(fen, 50);
  const [lichessOptions] = useAtom(lichessOptionsAtom);
  const [masterOptions] = useAtom(masterOptionsAtom);
  const [localOptions, setLocalOptions] = useAtom(currentLocalOptionsAtom);
  const [db, setDb] = useAtom(currentDbTypeAtom);

  useEffect(() => {
    if (db === "local") {
      setLocalOptions((q) => ({ ...q, fen: debouncedFen }));
    }
  }, [debouncedFen, setLocalOptions, db]);

  useEffect(() => {
    if (db === "local") {
      setLocalOptions((q) => ({ ...q, path: referenceDatabase }));
    }
  }, [referenceDatabase, setLocalOptions, db]);

  const dbType: DBType = match(db)
    .with("local", (v) => ({
      type: v,
      options: localOptions,
    }))
    .with("lch_all", (v) => ({
      type: v,
      options: lichessOptions,
      fen: debouncedFen,
    }))
    .with("lch_master", (v) => ({
      type: v,
      options: masterOptions,
      fen: debouncedFen,
    }))
    .exhaustive();

  const tab = useAtomValue(currentTabAtom);
  const [tabType, setTabType] = useAtom(currentDbTabAtom);

  const {
    data: openingData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["database-opening", dbType, tab?.value],
    queryFn: async () => {
      return fetchOpening(dbType, tab?.value || "");
    },
    enabled: tabType !== "options" && !!tab?.value,
  });

  const grandTotal = openingData?.openings?.reduce((acc, curr) => acc + curr.black + curr.white + curr.draw, 0);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between w-full mb-2">
        {/* Replaces SegmentedControl */}
        <div className="flex bg-muted p-1 rounded-md items-center">
          {[
            { label: t("features.board.database.local"), value: "local" },
            { label: t("features.board.database.lichessAll"), value: "lch_all" },
            { label: t("features.board.database.lichessMaster"), value: "lch_master" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setDb(item.value as "local" | "lch_all" | "lch_master")}
              className={`flex-1 text-sm px-3 py-1.5 rounded-sm transition-all ${
                db === item.value
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tabType !== "options" && (
          <span className="text-sm text-muted-foreground">
            {t("features.board.database.matches", {
              matches: Math.max(grandTotal || 0, openingData?.games.length || 0),
            })}
          </span>
        )}
      </div>

      <DatabaseLoader isLoading={isLoading} tab={tab?.value ?? null} />

      {/* Tailwind handles vertical structure to replace Mantine's vertical orientation hook */}
      <Tabs
        defaultValue="stats"
        value={tabType}
        onValueChange={(v) => setTabType(v as "stats" | "games" | "options")}
        className="flex flex-1 overflow-hidden flex-row-reverse"
      >
        <TabsList className="flex flex-col h-full w-32 items-stretch justify-start rounded-none border-l bg-transparent p-0">
          <TabsTrigger
            value="stats"
            disabled={dbType.type === "local" && dbType.options.type === "partial"}
            className="data-[state=active]:bg-muted rounded-none justify-start px-4 py-2"
          >
            {t("features.board.database.stats")}
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="data-[state=active]:bg-muted rounded-none justify-start px-4 py-2"
          >
            {t("features.board.database.games")}
          </TabsTrigger>
          <TabsTrigger
            value="options"
            className="data-[state=active]:bg-muted rounded-none justify-start px-4 py-2"
          >
            {t("features.board.database.options")}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden relative mr-2">
          <PanelWithError value="stats" error={error} type={db}>
            <OpeningsTable openings={openingData?.openings || []} loading={isLoading} />
          </PanelWithError>
          <PanelWithError value="games" error={error} type={db}>
            <GamesTable games={openingData?.games || []} loading={isLoading} />
          </PanelWithError>
          <PanelWithError value="options" error={error} type={db}>
            <ScrollArea className="h-full">
              {match(db)
                .with("local", () => <LocalOptionsPanel boardFen={debouncedFen} />)
                .with("lch_all", () => <LichessOptionsPanel />)
                .with("lch_master", () => <MasterOptionsPanel />)
                .exhaustive()}
            </ScrollArea>
          </PanelWithError>
        </div>
      </Tabs>
    </div>
  );
}

function PanelWithError(props: { value: string; error: Error | null; type: string; children: React.ReactNode }) {
  const referenceDatabase = useAtomValue(referenceDbAtom);
  let children = props.children;
  
  if (props.type === "local" && !referenceDatabase) {
    children = <NoDatabaseWarning />;
  }
  if (props.error && props.type !== "local") {
    children = (
      <div className="p-4 rounded-md bg-destructive/15 text-destructive border border-destructive/20 text-sm">
        {props.error.message}
      </div>
    );
  }

  return (
    <TabsContent value={props.value} className="h-full mt-0 pt-2 flex flex-col data-[state=inactive]:hidden">
      {children}
    </TabsContent>
  );
}

export default memo(DatabasePanel);