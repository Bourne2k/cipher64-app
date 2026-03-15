import { createFileRoute } from '@tanstack/react-router';
import { TreeStateProvider } from '@/components/TreeStateContext';
import Puzzles from '@/features/boards/components/puzzles/Puzzles';

export const Route = createFileRoute('/learn')({
  component: LearnPage,
})

function LearnPage() {
  return (
    <div className="h-full w-full bg-background p-4 animate-in fade-in duration-300">
      <TreeStateProvider id="learn-puzzles-tab">
         <Puzzles id="learn-puzzles-tab" />
      </TreeStateProvider>
    </div>
  );
}