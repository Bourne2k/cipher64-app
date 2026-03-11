import { useEffect, useRef, useState } from 'react';
import { Chessground as NativeChessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import { useAtomValue } from 'jotai';

import  { boardImageAtom as boardThemeAtom, pieceSetAtom as pieceThemeAtom, showCoordinatesAtom } from '@/state/atoms';


interface ChessgroundProps {
    config?: Config;
    className?: string;
    onInitialize?: (api: Api) => void;
}

export function Chessground({ config, className = '', onInitialize }: ChessgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [api, setApi] = useState<Api | null>(null);

    const boardTheme = useAtomValue(boardThemeAtom);
    const pieceTheme = useAtomValue(pieceThemeAtom);
    const showCoords = useAtomValue(showCoordinatesAtom);

    useEffect(() => {
        if (containerRef.current && !api) {
            const cgApi = NativeChessground(containerRef.current, {
                ...config,
                coordinates: showCoords,
            });
            setApi(cgApi);
            if (onInitialize) onInitialize(cgApi);
        }
    }, [api, config, onInitialize, showCoords]);

    useEffect(() => {
        if (api) {
            api.set({ ...config, coordinates: showCoords });
        }
    }, [api, config, showCoords]);

    const themeClasses = `cg-board-${boardTheme} cg-pieces-${pieceTheme}`;

    return (
        <div
            ref={containerRef}
            className={`w-full h-full aspect-square ${themeClasses} ${className}`}
        />
    );
}