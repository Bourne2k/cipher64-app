import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Settings2,
  Camera,
  FlipVertical,
  Trash2,
  PenTool,
  Edit3,
  Save,
  RefreshCw,
  PlusSquare,
  Grid3X3
} from "lucide-react";

// Shadcn UI
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BoardControlsMenuProps {
  viewPawnStructure?: boolean;
  setViewPawnStructure?: (value: boolean) => void;
  takeSnapshot?: () => void;
  canTakeBack?: boolean;
  deleteMove?: () => void;
  changeTabType?: () => void;
  currentTabType?: "analysis" | "play";
  eraseDrawablesOnClick?: boolean;
  clearShapes?: () => void;
  disableVariations?: boolean;
  editingMode?: boolean;
  toggleEditingMode?: () => void;
  saveFile?: () => void;
  reload?: () => void;
  addGame?: () => void;
  toggleOrientation?: () => void;
  currentTabSourceType?: string;
  count?: number;
}

function BoardControlsMenu({
  viewPawnStructure,
  setViewPawnStructure,
  takeSnapshot,
  canTakeBack,
  deleteMove,
  changeTabType,
  currentTabType,
  clearShapes,
  disableVariations,
  editingMode,
  toggleEditingMode,
  saveFile,
  reload,
  addGame,
  toggleOrientation,
  currentTabSourceType,
}: BoardControlsMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-medium">

        {/* Core Board Actions */}
        {toggleOrientation && (
          <DropdownMenuItem onClick={toggleOrientation}>
            <FlipVertical className="mr-2 h-4 w-4" />
            {t("features.board.menu.flipBoard", "Flip Board")}
          </DropdownMenuItem>
        )}
        {takeSnapshot && (
          <DropdownMenuItem onClick={takeSnapshot}>
            <Camera className="mr-2 h-4 w-4" />
            {t("features.board.menu.takeSnapshot", "Take Snapshot")}
          </DropdownMenuItem>
        )}
        {clearShapes && (
          <DropdownMenuItem onClick={clearShapes}>
            <PenTool className="mr-2 h-4 w-4" />
            {t("features.board.menu.clearShapes", "Clear Arrows")}
          </DropdownMenuItem>
        )}

        {setViewPawnStructure && (
          <DropdownMenuItem onClick={() => setViewPawnStructure(!viewPawnStructure)}>
            <Grid3X3 className="mr-2 h-4 w-4" />
            {viewPawnStructure
              ? t("features.board.menu.hidePawnStructure", "Hide Pawn Structure")
              : t("features.board.menu.viewPawnStructure", "View Pawn Structure")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Editing & Analysis Modes */}
        {toggleEditingMode && (
          <DropdownMenuItem onClick={toggleEditingMode}>
            <Edit3 className="mr-2 h-4 w-4" />
            {editingMode
              ? t("features.board.menu.exitSetup", "Exit Setup Mode")
              : t("features.board.menu.setupPosition", "Setup Position")}
          </DropdownMenuItem>
        )}

        {currentTabType === "analysis" && !disableVariations && deleteMove && (
          <DropdownMenuItem onClick={deleteMove} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("features.board.menu.deleteMove", "Delete Move")}
          </DropdownMenuItem>
        )}

        {/* Database / File Actions */}
        {currentTabSourceType === "file" && (
          <>
            <DropdownMenuSeparator />
            {saveFile && (
              <DropdownMenuItem onClick={saveFile}>
                <Save className="mr-2 h-4 w-4" />
                {t("features.board.menu.saveFile", "Save File")}
              </DropdownMenuItem>
            )}
            {reload && (
              <DropdownMenuItem onClick={reload}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("features.board.menu.reloadFile", "Reload File")}
              </DropdownMenuItem>
            )}
            {addGame && (
              <DropdownMenuItem onClick={addGame}>
                <PlusSquare className="mr-2 h-4 w-4" />
                {t("features.board.menu.addGame", "Add New Game")}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default memo(BoardControlsMenu);