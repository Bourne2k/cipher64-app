import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { RightDock } from '@/components/RightDock';
import { TopBar } from '@/components/TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeInjector } from '@/features/themes/ThemeInjector'; // <-- 1. Import it

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="cipher64-theme">
      <TooltipProvider delayDuration={200}>
        <ThemeInjector /> {/* <-- 2. Mount it here to load piece CSS! */}

        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <TopBar />
            <main className="flex-1 overflow-auto bg-muted/10 relative">
              <Outlet />
            </main>
          </div>
          <RightDock />
        </div>

        <Toaster position="bottom-right" theme="dark" />
      </TooltipProvider>
    </ThemeProvider>
  ),
});