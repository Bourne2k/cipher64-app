import { useTranslation } from "react-i18next";
import type { PuzzleDatabaseInfo } from "@/bindings";

// Shadcn UI
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PuzzleSettingsProps {
    puzzleDbs: PuzzleDatabaseInfo[];
    selectedDb: string | null;
    onDatabaseChange: (value: string | null) => void;
    ratingRange: [number, number];
    onRatingRangeChange: (value: [number, number]) => void;
    minRating: number;
    maxRating: number;
    dbRatingRange: [number, number] | null;
    progressive: boolean;
    onProgressiveChange: (value: boolean) => void;
    hideRating: boolean;
    onHideRatingChange: (value: boolean) => void;
    inOrder: boolean;
    onInOrderChange: (value: boolean) => void;
}

export const PuzzleSettings = ({
    puzzleDbs,
    selectedDb,
    onDatabaseChange,
    ratingRange,
    onRatingRangeChange,
    minRating,
    maxRating,
    dbRatingRange,
    progressive,
    onProgressiveChange,
    hideRating,
    onHideRatingChange,
    inOrder,
    onInOrderChange,
}: PuzzleSettingsProps) => {
    const { t } = useTranslation();

    const isProgressiveDisabled = !dbRatingRange || (dbRatingRange && dbRatingRange[0] === dbRatingRange[1]);
    const isProgressiveChecked = dbRatingRange && dbRatingRange[0] === dbRatingRange[1] ? false : progressive;

    return (
        <div className="space-y-6">

            {/* Database Selector */}
            <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Database
                </Label>
                <Select
                    value={selectedDb || undefined}
                    onValueChange={onDatabaseChange}
                >
                    <SelectTrigger className="w-full font-semibold">
                        <SelectValue placeholder={t("features.puzzle.selectDatabase", "Select Database")} />
                    </SelectTrigger>
                    <SelectContent>
                        {puzzleDbs.map((p) => (
                            <SelectItem key={p.path} value={p.path}>
                                {p.title.split(".db3")[0]}
                            </SelectItem>
                        ))}
                        <SelectItem value="add" className="font-bold text-primary">
                            + {t("common.addNew", "Add New")}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Rating Range Slider */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {t("features.puzzle.ratingRange", "Rating Range")}
                    </Label>
                    <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                        {ratingRange[0]} - {ratingRange[1]}
                    </span>
                </div>
                <Slider
                    value={[ratingRange[0], ratingRange[1]]}
                    onValueChange={(val) => onRatingRangeChange([val[0], val[1]] as [number, number])}
                    min={minRating}
                    max={maxRating}
                    step={50}
                    disabled={progressive || isProgressiveDisabled}
                    className="py-1"
                />
                {!dbRatingRange && selectedDb && (
                    <p className="text-[10px] text-muted-foreground animate-pulse">
                        {t("features.puzzle.loadingRatingRange", "Loading rating range...")}
                    </p>
                )}
            </div>

            {/* Switches Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md border border-border/50">
                    <Label className="text-xs font-semibold leading-tight">
                        {t("features.puzzle.progressive", "Progressive")}
                    </Label>
                    <Switch
                        checked={isProgressiveChecked}
                        onCheckedChange={onProgressiveChange}
                        disabled={isProgressiveDisabled}
                    />
                </div>

                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md border border-border/50">
                    <Label className="text-xs font-semibold leading-tight">
                        {t("features.puzzle.hideRating", "Hide Rating")}
                    </Label>
                    <Switch
                        checked={hideRating}
                        onCheckedChange={onHideRatingChange}
                    />
                </div>

                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md border border-border/50">
                    <Label className="text-xs font-semibold leading-tight">
                        {t("features.puzzle.inOrder", "Play In Order")}
                    </Label>
                    <Switch
                        checked={inOrder}
                        onCheckedChange={onInOrderChange}
                    />
                </div>
            </div>

        </div>
    );
};