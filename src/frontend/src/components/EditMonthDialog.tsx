import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useCreateOrUpdateMonthlyRecord } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { MonthlyRecord } from '../backend';

interface EditMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  currentRecord: MonthlyRecord;
}

export function EditMonthDialog({ open, onOpenChange, month, year, currentRecord }: EditMonthDialogProps) {
  const [workedHours, setWorkedHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');

  const updateMutation = useCreateOrUpdateMonthlyRecord();

  useEffect(() => {
    if (currentRecord) {
      setWorkedHours(currentRecord.workedHours.toString());
      setHourlyRate((Number(currentRecord.hourlyRateCents) / 100).toFixed(2));
      setTransportAllowance((Number(currentRecord.transportAllowanceCents) / 100).toFixed(2));
    }
  }, [currentRecord]);

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
      await updateMutation.mutateAsync({
        month,
        year,
        workedHours: hours,
        hourlyRateCents: rateCents,
        transportAllowanceCents: allowanceCents,
      });
      toast.success('Mesečni zapis uspešno posodobljen');
      onOpenChange(false);
    } catch (error) {
      toast.error('Napaka pri posodabljanju mesečnega zapisa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Uredi mesečni zapis</DialogTitle>
            <DialogDescription>
              Posodobite delovne ure in podrobnosti o plačilu za ta mesec
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workedHours">Opravljene ure</Label>
              <Input
                id="workedHours"
                type="number"
                value={workedHours}
                onChange={(e) => setWorkedHours(e.target.value)}
                min="0"
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
                  onChange={(e) => setHourlyRate(e.target.value)}
                  min="0"
                  className="pl-7"
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
                  onChange={(e) => setTransportAllowance(e.target.value)}
                  min="0"
                  className="pl-7"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Prekliči
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Shranjevanje...' : 'Shrani spremembe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
