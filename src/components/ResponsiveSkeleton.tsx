import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ResponsiveSkeletonProps {
    type?: "board" | "panel" | "default";
}

export const ResponsiveSkeleton = memo(function ResponsiveSkeleton({ type = "default" }: ResponsiveSkeletonProps) {
    if (type === "board") {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
                {/* Top Player Info Skeleton */}
                <div className="flex items-center justify-between w-full max-w-[85vh] h-8 px-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                </div>

                {/* Main Board Skeleton */}
                <Skeleton className="w-full max-w-[85vh] aspect-square rounded-sm shadow-md" />

                {/* Bottom Player Info / Controls Skeleton */}
                <div className="flex items-center justify-between w-full max-w-[85vh] h-10 px-2 mt-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full max-w-[200px]" />
                </div>
            </div>
        );
    }

    if (type === "panel") {
        return (
            <div className="flex flex-col h-full w-full p-4 gap-4 bg-card border border-border/50 rounded-md">
                {/* Panel Tabs Skeleton */}
                <div className="flex gap-2 mb-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>

                {/* Panel Content Skeleton Rows */}
                <div className="flex flex-col gap-3 flex-1">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-[90%]" />
                    <Skeleton className="h-12 w-[95%]" />
                    <Skeleton className="h-12 w-[80%]" />
                </div>
            </div>
        );
    }

    // Default / Generic layout
    return (
        <div className="flex h-full w-full p-4 gap-4">
            <Skeleton className="flex-1 h-full rounded-md" />
            <div className="w-[300px] flex flex-col gap-4">
                <Skeleton className="h-1/2 w-full rounded-md" />
                <Skeleton className="h-1/2 w-full rounded-md" />
            </div>
        </div>
    );
});