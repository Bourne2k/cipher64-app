import { Link } from '@tanstack/react-router';
import { Home, Cpu, Database, BookOpen, Settings, UserCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
    { icon: Home, label: 'Dashboard', to: '/' },
    { icon: Cpu, label: 'Play & Analyze', to: '/play' },
    { icon: Database, label: 'Databases', to: '/databases' },
    { icon: BookOpen, label: 'Learn', to: '/learn' },
    { icon: Settings, label: 'Settings', to: '/settings' },
];

export function RightDock() {
    return (
        <div className="w-16 h-full flex flex-col items-center py-4 bg-background border-l border-border z-50 shadow-[-4px_0_24px_-10px_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                64
            </div>

            <TooltipProvider delayDuration={100}>
                <nav className="flex flex-1 flex-col gap-4">
                    {NAV_ITEMS.map((item) => (
                        <Tooltip key={item.to}>
                            <TooltipTrigger asChild>
                                <Link
                                    to={item.to}
                                    className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary data-[status=active]:shadow-inner"
                                >
                                    <item.icon className="h-5 w-5" />
                                    {/* Active Indicator Dot */}
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary opacity-0 group-data-[status=active]:opacity-100 transition-opacity" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={10} className="font-semibold tracking-wide">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </nav>

                {/* Bottom Account Action */}
                <div className="mt-auto flex flex-col gap-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                to="/accounts"
                                className="group flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:text-primary"
                            >
                                <UserCircle className="h-5 w-5" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="left" sideOffset={10}>Account & License</TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </div>
    );
}