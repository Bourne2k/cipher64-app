import { createFileRoute } from '@tanstack/react-router';
import { TreeStateProvider } from '@/components/TreeStateContext';
import DatabasePanel from '@/components/panels/database/DatabasePanel';
import { Database } from 'lucide-react';

export const Route = createFileRoute('/databases')({
  component: DatabasesPage,
})

function DatabasesPage() {
  return (
    <div className="flex flex-col h-full w-full bg-background p-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
         <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
         </div>
         <div>
            <h1 className="text-2xl font-bold tracking-tight">Game Databases</h1>
            <p className="text-muted-foreground text-sm">Explore master games and your local repositories.</p>
         </div>
      </div>
      
      <div className="flex-1 bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm max-w-5xl mx-auto w-full">
        <TreeStateProvider id="global-database-explorer">
           <DatabasePanel />
        </TreeStateProvider>
      </div>
    </div>
  );
}