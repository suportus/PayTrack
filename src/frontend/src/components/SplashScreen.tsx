import { DollarSign } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary/20 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/50">
            <DollarSign className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">PayTrack</h1>
          <p className="mt-2 text-sm text-muted-foreground">Nalaganje...</p>
        </div>
      </div>
    </div>
  );
}
