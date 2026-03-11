import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { RightDock } from '@/components/RightDock'; // NEW IMPORT
import { TopBar } from '@/components/TopBar';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="cipher64-theme">
      {/* Notice the flex-row layout here now puts content left, dock right */}
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <TopBar />
          <main className="flex-1 overflow-auto bg-muted/10 relative">
            <Outlet />
          </main>
        </div>

        {/* The new Right-Side Navigation Dock */}
        <RightDock />

      </div>
      <Toaster position="bottom-right" theme="dark" />
    </ThemeProvider>
  ),
});