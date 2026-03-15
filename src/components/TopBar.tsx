import { Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Button } from '@/components/ui/button';

export function TopBar() {
  // FIX: Grab the existing window context instead of creating a new one!
  const appWindow = getCurrentWindow();

  const minimize = () => appWindow.minimize();
  const toggleMaximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="flex h-10 w-full select-none items-center justify-between border-b border-border bg-card/50 px-4"
    >
      {/* Draggable Title Area */}
      <div data-tauri-drag-region className="flex flex-1 items-center gap-2 text-sm font-semibold text-muted-foreground pointer-events-none">
        Cipher64 Premium
      </div>

      {/* Window Controls - Excluded from drag region */}
      <div className="flex items-center gap-1 z-50">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={minimize}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={toggleMaximize}>
          <Square className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm hover:bg-destructive hover:text-destructive-foreground" onClick={close}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}