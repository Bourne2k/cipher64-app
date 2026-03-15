import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Mosaic, type MosaicNode } from "react-mosaic-component";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { match } from "ts-pattern";
import { Plus } from "lucide-react";

// Workspace Imports
import { TreeStateProvider } from "@/components/TreeStateContext";
import { useTabManagement } from "./hooks/useTabManagement";
import type { Tab } from "@/utils/tabs";
import { createTab } from "@/utils/tabs";

// Components (We will migrate these next, standardizing them to Shadcn)
import { BoardTab } from "./components/BoardTab";
import NewTab from "./components/NewTab";
import BoardGame from "./components/BoardGame";
import BoardAnalysis from "./components/BoardAnalysis";
import BoardVariants from "./components/BoardVariants";
import Puzzles from "./components/puzzles/Puzzles";

// UI Primitives
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import "react-mosaic-component/react-mosaic-component.css";
import "@/styles/react-mosaic.css";

// Constants
import {
    CUSTOM_EVENTS, createFullLayout, DEFAULT_MOSAIC_LAYOUT,
    DROPPABLE_IDS, MAX_TABS, MOSAIC_PANE_CONSTRAINTS,
    STORAGE_KEYS, type ViewId, constrainSplitPercentage
} from "./constants";

const fullLayout = createFullLayout();

export default function BoardsPage() {
    const { t } = useTranslation();
    const {
        tabs, activeTab, setActiveTab, setTabs, closeTab,
        renameTab, duplicateTab, canCreateNewTab, showTabLimitNotification,
    } = useTabManagement();

    const handleCreateTab = useCallback(() => {
        if (!canCreateNewTab()) {
            showTabLimitNotification();
            return;
        }
        createTab({
            tab: { name: t("features.tabs.newTab", "New Tab"), type: "new" },
            setTabs, setActiveTab,
        });
    }, [canCreateNewTab, showTabLimitNotification, t, setTabs, setActiveTab]);

    return (
        <DragDropContext
            onDragEnd={({ destination, source }) => {
                if (!destination) return;
                if (source.droppableId === DROPPABLE_IDS.TABS && destination.droppableId === DROPPABLE_IDS.TABS) {
                    setTabs((prev) => {
                        const result = Array.from(prev);
                        const [removed] = result.splice(source.index, 1);
                        result.splice(destination.index, 0, removed);
                        return result;
                    });
                }
            }}
        >
            <div className="flex flex-col h-full w-full bg-background overflow-hidden">

                {/* TOP TAB BAR */}
                <div className="flex items-center px-2 py-1.5 bg-muted/30 border-b border-border shrink-0">
                    <ScrollArea className="flex-1 w-full whitespace-nowrap">
                        <Droppable droppableId={DROPPABLE_IDS.TABS} direction="horizontal">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="flex items-center gap-1.5 px-1 py-1">
                                    {tabs.map((tab, i) => (
                                        <Draggable key={tab.value} draggableId={tab.value} index={i}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                    <BoardTab
                                                        tab={tab}
                                                        setActiveTab={setActiveTab}
                                                        closeTab={closeTab}
                                                        renameTab={renameTab}
                                                        duplicateTab={duplicateTab}
                                                        selected={activeTab === tab.value}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCreateTab}
                                        disabled={!canCreateNewTab()}
                                        className="h-8 w-8 ml-1 shrink-0 text-muted-foreground hover:text-foreground"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </Droppable>
                        <ScrollBar orientation="horizontal" className="h-1.5" />
                    </ScrollArea>
                </div>

                {/* WORKSPACE CONTENT AREA */}
                <div className="flex-1 overflow-hidden relative">
                    {tabs.map((tab) => (
                        <div key={tab.value} className={`absolute inset-0 transition-opacity duration-200 ${activeTab === tab.value ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                            {activeTab === tab.value && <TabSwitch tab={tab} />}
                        </div>
                    ))}
                </div>

            </div>
        </DragDropContext>
    );
}

// --- MOSAIC WINDOW STATE ---
const windowsStateAtom = atomWithStorage<{ currentNode: MosaicNode<ViewId> | null }>(
    STORAGE_KEYS.WINDOWS_STATE, { currentNode: DEFAULT_MOSAIC_LAYOUT }
);

function TabSwitch({ tab }: { tab: Tab }) {
    const [windowsState, setWindowsState] = useAtom(windowsStateAtom);
    // Replaced useResponsiveLayout for now to guarantee desktop mosaic rendering
    const isMobileLayout = false;

    const resizeOptions = useMemo(() => ({
        minimumPaneSizePercentage: MOSAIC_PANE_CONSTRAINTS.MINIMUM_PERCENTAGE,
        maximumPaneSizePercentage: MOSAIC_PANE_CONSTRAINTS.MAXIMUM_PERCENTAGE,
    }), []);

    const handleMosaicChange = useCallback((currentNode: MosaicNode<ViewId> | null) => {
        if (currentNode && typeof currentNode === "object" && "direction" in currentNode) {
            if (currentNode.direction === "row") {
                const constrainedPercentage = constrainSplitPercentage(currentNode.splitPercentage);
                if (currentNode.splitPercentage !== constrainedPercentage) {
                    currentNode = { ...currentNode, splitPercentage: constrainedPercentage };
                }
            }
        }
        setWindowsState({ currentNode });
    }, [setWindowsState]);

    return match(tab.type)
        .with("new", () => <NewTab id={tab.value} />)
        .with("play", () => (
            <TreeStateProvider id={tab.value}>
                {!isMobileLayout && (
                    <Mosaic<ViewId>
                        renderTile={(id) => fullLayout[id]}
                        value={windowsState.currentNode}
                        onChange={handleMosaicChange}
                        resize={resizeOptions}
                    />
                )}
                <BoardGame />
            </TreeStateProvider>
        ))
        .with("analysis", () => {
            const isVariantsFile = tab.source?.type === "file" && tab.source.metadata?.type === "variants";
            return (
                <TreeStateProvider id={tab.value}>
                    {!isMobileLayout && (
                        <Mosaic<ViewId>
                            renderTile={(id) => fullLayout[id]}
                            value={windowsState.currentNode}
                            onChange={handleMosaicChange}
                            resize={resizeOptions}
                        />
                    )}
                    {isVariantsFile ? <BoardVariants /> : <BoardAnalysis />}
                </TreeStateProvider>
            );
        })
        .with("puzzles", () => (
            <TreeStateProvider id={tab.value}>
                <Mosaic<ViewId>
                    renderTile={(id) => fullLayout[id]}
                    value={windowsState.currentNode}
                    onChange={handleMosaicChange}
                    resize={resizeOptions}
                />
                <Puzzles id={tab.value} />
            </TreeStateProvider>
        ))
        .exhaustive();
}