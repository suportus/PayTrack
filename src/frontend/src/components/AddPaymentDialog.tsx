import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAddPayment, useHasExistingPayments } from '../hooks/useQueries';
import { toast } from 'sonner';

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
}

export function AddPaymentDialog({ open, onOpenChange, month, year }: AddPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'bank' | 'cash'>('bank');

  const addPaymentMutation = useAddPayment();
  const { data: hasExistingPayments, isLoading: isCheckingPayments } = useHasExistingPayments(month, year);

  // Update payment type based on whether there are existing payments
  useEffect(() => {
    if (!isCheckingPayments && hasExistingPayments !== undefined) {
      setPaymentType(hasExistingPayments ? 'cash' : 'bank');
    }
  }, [hasExistingPayments, isCheckingPayments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error('Prosimo, vnesite veljaven znesek plačila');
      return;
    }

    try {
      await addPaymentMutation.mutateAsync({
        month,
        year,
        amountCents,
      });
      toast.success('Plačilo uspešno dodano');
      onOpenChange(false);
      setAmount('');
    } catch (error) {
      toast.error('Napaka pri dodajanju plačila');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dodaj plačilo</DialogTitle>
            <DialogDescription>
              Zabeležite novo plačilo za ta mesec
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Znesek plačila</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">Način plačila (privzeto)</Label>
              <Select value={paymentType} onValueChange={(value: 'bank' | 'cash') => setPaymentType(value)}>
                <SelectTrigger id="paymentType" disabled={isCheckingPayments}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bančno nakazilo</SelectItem>
                  <SelectItem value="cash">Gotovina</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isCheckingPayments 
                  ? 'Preverjanje...' 
                  : hasExistingPayments 
                    ? 'Privzeto: Gotovina (obstajajo že plačila)' 
                    : 'Privzeto: Bančno nakazilo (prvo plačilo)'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Prekliči
            </Button>
            <Button type="submit" disabled={addPaymentMutation.isPending || isCheckingPayments}>
              {addPaymentMutation.isPending ? 'Dodajanje...' : 'Dodaj plačilo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
