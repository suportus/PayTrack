import { Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();
  
  const [hourlyRate, setHourlyRate] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');

  useEffect(() => {
    if (userProfile) {
      setHourlyRate((Number(userProfile.defaultHourlyRateCents) / 100).toFixed(2));
      setTransportAllowance((Number(userProfile.defaultTransportAllowanceCents) / 100).toFixed(2));
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) {
      toast.error('Profil ni na voljo');
      return;
    }

    const hourlyRateCents = Math.round(parseFloat(hourlyRate) * 100);
    const transportAllowanceCents = Math.round(parseFloat(transportAllowance) * 100);

    if (isNaN(hourlyRateCents) || hourlyRateCents < 0) {
      toast.error('Prosimo, vnesite veljavno urno postavko');
      return;
    }

    if (isNaN(transportAllowanceCents) || transportAllowanceCents < 0) {
      toast.error('Prosimo, vnesite veljaven prevozni dodatek');
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        name: userProfile.name,
        defaultHourlyRateCents: BigInt(hourlyRateCents),
        defaultTransportAllowanceCents: BigInt(transportAllowanceCents),
      });
      toast.success('Nastavitve uspešno shranjene');
    } catch (error) {
      toast.error('Napaka pri shranjevanju nastavitev');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        <Skeleton className="mb-6 sm:mb-8 h-10 w-48" />
        <Skeleton className="h-64 max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Nastavitve</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Nastavite privzete vrednosti za nove mesečne zapise</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Privzete vrednosti</CardTitle>
          <CardDescription className="text-sm">
            Te vrednosti bodo samodejno uporabljene za nove mesečne zapise, lahko pa jih spremenite za vsak mesec posebej
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate" className="text-sm sm:text-base">Privzeta urna postavka</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Privzeti znesek, ki ga zaslužite na uro
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transportAllowance" className="text-sm sm:text-base">Privzeti prevozni dodatek</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              <Input
                id="transportAllowance"
                type="number"
                step="0.01"
                min="0"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Privzeti mesečni prevozni dodatek
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saveProfileMutation.isPending}
              className="gap-2 w-full sm:w-auto"
            >
              {saveProfileMutation.isPending ? (
                <>Shranjevanje...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Shrani nastavitve
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
