import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCreateOrUpdateMonthlyRecord, useGetCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';

interface CreateMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'
];

export function CreateMonthDialog({ open, onOpenChange }: CreateMonthDialogProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [workedHours, setWorkedHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [useDefaults, setUseDefaults] = useState(true);

  const { data: userProfile } = useGetCallerUserProfile();
  const createMutation = useCreateOrUpdateMonthlyRecord();

  useEffect(() => {
    if (userProfile && useDefaults) {
      setHourlyRate((Number(userProfile.defaultHourlyRateCents) / 100).toFixed(2));
      setTransportAllowance((Number(userProfile.defaultTransportAllowanceCents) / 100).toFixed(2));
    }
  }, [userProfile, useDefaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hours = parseInt(workedHours);
    const rateCents = Math.round(parseFloat(hourlyRate) * 100);
    const allowanceCents = Math.round(parseFloat(transportAllowance) * 100);

    if (isNaN(hours) || hours < 0) {
      toast.error('Prosimo, vnesite veljavno število ur');
      return;
    }

    if (isNaN(rateCents) || rateCents < 0) {
      toast.error('Prosimo, vnesite veljavno urno postavko');
      return;
    }

    if (isNaN(allowanceCents) || allowanceCents < 0) {
      toast.error('Prosimo, vnesite veljaven prevozni dodatek');
      return;
    }

    try {
      await createMutation.mutateAsync({
        month: parseInt(month),
        year: parseInt(year),
        workedHours: hours,
        hourlyRateCents: rateCents,
        transportAllowanceCents: allowanceCents,
      });
      toast.success('Mesečni zapis uspešno ustvarjen');
      onOpenChange(false);
      // Reset form
      setMonth(currentMonth.toString());
      setYear(currentYear.toString());
      setWorkedHours('');
      setUseDefaults(true);
    } catch (error) {
      toast.error('Napaka pri ustvarjanju mesečnega zapisa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ustvari mesečni zapis</DialogTitle>
            <DialogDescription>
              Dodajte nov mesečni zapis z urami in podrobnostmi o plačilu
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mesec</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Leto</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workedHours">Opravljene ure</Label>
              <Input
                id="workedHours"
                type="number"
                value={workedHours}
                onChange={(e) => setWorkedHours(e.target.value)}
                min="0"
                placeholder="Vnesite število ur"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Urna postavka</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => {
                    setHourlyRate(e.target.value);
                    setUseDefaults(false);
                  }}
                  min="0"
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportAllowance">Prevozni dodatek</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="transportAllowance"
                  type="number"
                  step="0.01"
                  value={transportAllowance}
                  onChange={(e) => {
                    setTransportAllowance(e.target.value);
                    setUseDefaults(false);
                  }}
                  min="0"
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Prekliči
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Ustvarjanje...' : 'Ustvari zapis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
