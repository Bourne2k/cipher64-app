import { Link } from '@tanstack/react-router';
import { Home, Cpu, Database, BookOpen, Settings, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { icon: Home, label: 'Play', to: '/' },
  { icon: Cpu, label: 'Engines', to: '/engines' },
  { icon: Database, label: 'Databases', to: '/databases' },
  { icon: BookOpen, label: 'Learn', to: '/learn' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export function Sidebar() {
  return (
    <div className="flex w-16 flex-col items-center border-r border-border bg-card py-4 z-50">
      {/* Brand Logo Placeholder */}
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-md">
        C64
      </div>

      <TooltipProvider delayDuration={200}>
        <nav className="flex flex-1 flex-col gap-4">
          {NAV_ITEMS.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <Link
                  to={item.to}
                  className="group flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Bottom Action: Account / License Status */}
        <div className="mt-auto flex flex-col gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/accounts"
                className="group flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
              >
                <UserCircle className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Account & License</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}