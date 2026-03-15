import React, { type ReactNode, useEffect, useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { ResponsiveSkeleton } from "./ResponsiveSkeleton";

interface ResponsiveLoadingProps {
    children: ReactNode;
    fallback?: ReactNode;
    loadingComponent?: ReactNode;
    isLoading?: boolean;
}

export function ResponsiveLoadingWrapper({
    children,
    fallback,
    loadingComponent,
    isLoading = false,
}: ResponsiveLoadingProps) {
    const { layout } = useResponsiveLayout();
    const [isLayoutCalculating, setIsLayoutCalculating] = useState(true);

    useEffect(() => {
        // Minimal delay to ensure layout calculations complete before rendering the complex board
        const timer = setTimeout(() => {
            setIsLayoutCalculating(false);
        }, 50);

        return () => clearTimeout(timer);
    }, [layout]);

    if (isLoading || isLayoutCalculating) {
        return loadingComponent || <ResponsiveSkeleton type="default" />;
    }

    if (!layout) {
        return fallback || <div className="p-4 text-muted-foreground text-sm font-medium">Default Layout</div>;
    }

    return <>{children}</>;
}