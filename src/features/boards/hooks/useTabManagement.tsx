import { useCallback, useContext, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { toast } from "sonner"; // Replaced Mantine notifications

// State & Utils
import { commands } from "@/bindings/generated";
import { TreeStateContext } from "@/components/TreeStateContext";
import { MAX_TABS } from "@/features/boards/constants";
import { activeTabAtom, currentTabAtom, tabsAtom } from "@/state/atoms";
import { keyMapAtom } from "@/state/keybindings";
import { createTab, genID, saveToFile } from "@/utils/tabs";
import { unwrap } from "@/utils/unwrap";

// Note: Replace with actual hook if you use a specific router like TanStack
const useDocumentDir = () => ({ documentDir: "default/path" });

function isValidTabState(value: unknown): value is { version: number; state: { dirty?: boolean } } {
    return typeof value === "object" && value !== null && "version" in value && "state" in value;
}

function getTabState(tabId: string) {
    try {
        const rawState = sessionStorage.getItem(tabId);
        if (!rawState) return null;
        const parsedState = JSON.parse(rawState);
        if (isValidTabState(parsedState)) return parsedState;
        return null;
    } catch (error) {
        console.error(`Failed to retrieve tab state for tab: ${tabId}`, error);
        return null;
    }
}

export function useTabManagement() {
    const { t } = useTranslation();
    const [tabs, setTabs] = useAtom(tabsAtom);
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const [currentTab, setCurrentTab] = useAtom(currentTabAtom);
    const { documentDir } = useDocumentDir();

    const store = useContext(TreeStateContext);

    useEffect(() => {
        if (tabs.length === 0) {
            createTab({
                tab: { name: t("features.tabs.newTab", "New Tab"), type: "new" },
                setTabs,
                setActiveTab,
            });
        }
    }, [tabs.length, setActiveTab, setTabs, t]);

    const closeTab = useCallback(async (value: string | null, forced?: boolean) => {
        if (value === null) return;

        const tabState = getTabState(value);
        let hasSource = false;

        setTabs((prevTabs) => {
            const closedTab = prevTabs.find((tab) => tab.value === value);
            hasSource = !!closedTab?.source;
            return prevTabs;
        });

        if (tabState?.state?.dirty && hasSource && !forced && store) {
            // Replaced Mantine Modal with native confirm for hook purity 
            // (Can be upgraded to Shadcn AlertDialog later)
            const confirmClose = window.confirm(t("common.unsavedChanges.desc", "You have unsaved changes. Close anyway?"));
            if (!confirmClose) {
                saveToFile({ dir: documentDir, setCurrentTab, tab: currentTab, store });
            }
            closeTab(value, true);
            return;
        }

        setTabs((prevTabs) => {
            const index = prevTabs.findIndex((tab) => tab.value === value);
            if (index === -1) return prevTabs;

            const newTabs = prevTabs.filter((tab) => tab.value !== value);

            setActiveTab((currentActiveTab) => {
                if (value === currentActiveTab) {
                    if (newTabs.length === 0) return null;
                    if (index === prevTabs.length - 1) return newTabs[index - 1].value;
                    return newTabs[index].value;
                }
                return currentActiveTab;
            });

            return newTabs;
        });

        try {
            // Assuming killEngines exists in your generated bindings
            if (commands.killEngines) unwrap(await commands.killEngines(value));
        } catch (error) {
            console.error(`Failed to kill engines for tab: ${value}`, error);
        }
    }, [setTabs, setActiveTab, documentDir, currentTab, setCurrentTab, store, t]);

    const selectTab = useCallback((index: number) => {
        setTabs((prevTabs) => {
            const targetIndex = Math.min(index, prevTabs.length - 1);
            if (targetIndex >= 0 && prevTabs[targetIndex]) setActiveTab(prevTabs[targetIndex].value);
            return prevTabs;
        });
    }, [setTabs, setActiveTab]);

    const cycleTabs = useCallback((reverse = false) => {
        setTabs((prevTabs) => {
            setActiveTab((currentActiveTab) => {
                const index = prevTabs.findIndex((tab) => tab.value === currentActiveTab);
                if (reverse) return index === 0 ? prevTabs[prevTabs.length - 1].value : prevTabs[index - 1].value;
                return index === prevTabs.length - 1 ? prevTabs[0].value : prevTabs[index + 1].value;
            });
            return prevTabs;
        });
    }, [setTabs, setActiveTab]);

    const renameTab = useCallback((value: string, name: string) => {
        setTabs((prev) => prev.map((tab) => tab.value === value ? { ...tab, name } : tab));
    }, [setTabs]);

    const duplicateTab = useCallback((value: string) => {
        const id = genID();
        setTabs((prevTabs) => {
            const tab = prevTabs.find((tab) => tab.value === value);
            try {
                const existingState = sessionStorage.getItem(value);
                if (existingState) sessionStorage.setItem(id, existingState);
            } catch (error) {
                console.error(`Failed to duplicate tab state`, error);
            }

            if (tab) {
                setActiveTab(id);
                return [...prevTabs, { name: tab.name, value: id, type: tab.type }];
            }
            return prevTabs;
        });
    }, [setTabs, setActiveTab]);

    const canCreateNewTab = useCallback(() => tabs.length < MAX_TABS, [tabs.length]);

    const showTabLimitNotification = useCallback(() => {
        toast.warning(t("features.tabs.limitReached", "Tab limit reached"), {
            description: t("features.tabs.limitReachedDesc", `You cannot open more than ${MAX_TABS} tabs.`),
        });
    }, [t]);

    return {
        tabs, activeTab, setActiveTab, setTabs, closeTab, renameTab,
        duplicateTab, selectTab, cycleTabs, canCreateNewTab, showTabLimitNotification,
    };
}