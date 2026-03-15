import { useState, useEffect } from "react";

export function useResponsiveLayout() {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth < 768; // Standard Tailwind 'md' breakpoint

    return {
        layout: {
            chessBoard: {
                layoutType: isMobile ? "mobile" : "desktop",
                touchOptimized: isMobile,
            },
        },
    };
}