import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">Cipher64</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Phase 2 Complete. App shell is active. Next, we will migrate the
          Chessground board, Engine settings, and the Jotai State atoms.
        </p>
      </div>
    </div>
  );
}