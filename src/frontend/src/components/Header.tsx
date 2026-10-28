import { useState } from 'react';
import { Settings as SettingsIcon, ArrowLeft, DollarSign, Fuel, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from './ui/avatar';
import { CyclesDialog } from './CyclesDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  currentView: 'overview' | 'detail' | 'settings';
  onNavigateToSettings: () => void;
  onBackToOverview: () => void;
}

export function Header({ currentView, onNavigateToSettings, onBackToOverview }: HeaderProps) {
  const { clear } = useInternetIdentity();
  const [showCyclesDialog, setShowCyclesDialog] = useState(false);
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView !== 'overview' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToOverview}
              className="mr-1 sm:mr-2 h-8 w-8 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">PayTrack</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Sledenje uram in plačilom</p>
            </div>
            <h1 className="text-lg font-bold tracking-tight sm:hidden">PayTrack</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userProfile ? getInitials(userProfile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.name || 'Uporabnik'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Moj račun
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onNavigateToSettings} className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Privzete vrednosti
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCyclesDialog(true)} className="cursor-pointer">
                <Fuel className="mr-2 h-4 w-4" />
                Cycles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Odjava
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CyclesDialog open={showCyclesDialog} onOpenChange={setShowCyclesDialog} />
    </header>
  );
}
