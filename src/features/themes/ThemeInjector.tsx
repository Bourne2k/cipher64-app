import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
// Change this line:
import { pieceSetAtom as pieceThemeAtom } from '@/state/atoms';

export function ThemeInjector() {
    const pieceTheme = useAtomValue(pieceThemeAtom);

    useEffect(() => {
        const linkId = 'cg-piece-theme';
        let link = document.getElementById(linkId) as HTMLLinkElement;

        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        link.href = `/pieces/${pieceTheme}.css`;
    }, [pieceTheme]);

    return null;
}