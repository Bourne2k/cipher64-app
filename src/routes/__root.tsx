import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="cipher64-theme">
      {/* App Shell: Flex row to separate Sidebar from Main Content */}
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">

        {/* Left Navigation */}
        <Sidebar />

        {/* Right Area: TopBar + Page Content */}
        <div className="flex flex-1 flex-col overflow-hidden relative">

          {/* Draggable Window Controls */}
          <TopBar />

          {/* Main Content Area (Outlet renders the child routes here) */}
          <main className="flex-1 overflow-auto bg-muted/10 relative">
            <ThemeInjector />
            <Outlet />
          </main>

        </div>
      </div>

      {/* Global Toast Notifications */}
      <Toaster position="bottom-right" theme="dark" />
    </ThemeProvider>
  ),
});