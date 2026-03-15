import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import { getOpening } from "@/utils/chess";
import { TreeStateContext } from "./TreeStateContext";

export default function OpeningName() {
    const [openingName, setOpeningName] = useState("");
    const { t } = useTranslation();

    const store = useContext(TreeStateContext);
    if (!store) return null;

    const root = useStore(store, (s) => s.root);
    const position = useStore(store, (s) => s.position);

    useEffect(() => {
        getOpening(root, position).then((v) => setOpeningName(v));
    }, [root, position]);

    return (
        <span className="text-sm h-6 select-text font-semibold text-foreground/90 truncate max-w-[300px] inline-block">
            {openingName === "Empty Board"
                ? t("chess.opening.emptyBoard", "Empty Board")
                : openingName === "Starting Position"
                    ? t("chess.opening.startingPosition", "Starting Position")
                    : openingName}
        </span>
    );
}