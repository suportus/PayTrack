import { useState } from 'react';
import { DollarSign, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';

export function ProfileSetup() {
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('15.00');
  const [transportAllowance, setTransportAllowance] = useState('50.00');
  const saveProfileMutation = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Prosimo, vnesite svoje ime');
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
        name: name.trim(),
        defaultHourlyRateCents: BigInt(hourlyRateCents),
        defaultTransportAllowanceCents: BigInt(transportAllowanceCents),
      });
      toast.success('Profil uspešno nastavljen');
    } catch (error) {
      toast.error('Napaka pri nastavitvi profila');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <DollarSign className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Nastavitev profila</CardTitle>
          <CardDescription>
            Prosimo, nastavite svoj profil za nadaljevanje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vaše ime</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vnesite svoje ime"
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Privzeta urna postavka</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Privzeti znesek, ki ga zaslužite na uro
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportAllowance">Privzeti prevozni dodatek</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="transportAllowance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={transportAllowance}
                  onChange={(e) => setTransportAllowance(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Privzeti mesečni prevozni dodatek
              </p>
            </div>

            <Button
              type="submit"
              disabled={saveProfileMutation.isPending}
              className="w-full"
              size="lg"
            >
              {saveProfileMutation.isPending ? 'Shranjevanje...' : 'Nadaljuj'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
