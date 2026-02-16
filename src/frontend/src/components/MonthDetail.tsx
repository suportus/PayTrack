import { Plus, Trash2, Clock, DollarSign, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { useMonthlyRecord, useDeletePayment, useDeleteMonthlyRecord } from '../hooks/useQueries';
import { AddPaymentDialog } from './AddPaymentDialog';
import { EditMonthDialog } from './EditMonthDialog';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Payment } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface MonthDetailProps {
  month: number;
  year: number;
  onBack: () => void;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'
];

function formatCurrency(cents: bigint | number): string {
  const euros = Number(cents) / 100;
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function MonthDetail({ month, year, onBack }: MonthDetailProps) {
  const { data: record, isLoading } = useMonthlyRecord(month, year);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isEditMonthOpen, setIsEditMonthOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<bigint | null>(null);
  const [showDeleteMonthDialog, setShowDeleteMonthDialog] = useState(false);
  const deletePaymentMutation = useDeletePayment();
  const deleteMonthMutation = useDeleteMonthlyRecord();

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    try {
      await deletePaymentMutation.mutateAsync({
        month,
        year,
        paymentDate: paymentToDelete,
      });
      toast.success('Plačilo uspešno izbrisano');
      setPaymentToDelete(null);
    } catch (error) {
      toast.error('Napaka pri brisanju plačila');
    }
  };

  const handleDeleteMonth = async () => {
    try {
      await deleteMonthMutation.mutateAsync({
        month,
        year,
      });
      toast.success('Mesečni zapis uspešno izbrisan');
      setShowDeleteMonthDialog(false);
      onBack();
    } catch (error: any) {
      if (error.message?.includes('unpaid balance')) {
        toast.error('Meseca ni mogoče izbrisati, ker ima neporavnan saldo');
      } else {
        toast.error('Napaka pri brisanju mesečnega zapisa');
      }
      setShowDeleteMonthDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        <Skeleton className="mb-6 sm:mb-8 h-10 w-48 sm:w-64" />
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container py-4 sm:py-8 px-4 sm:px-6">
        <p>Zapis ni najden</p>
      </div>
    );
  }

  const totalPaid = record.payments.reduce((sum, payment) => {
    return sum + Number(payment.amountCents);
  }, 0);
  const remaining = Number(record.totalDueCents) - totalPaid;
  const monthName = MONTH_NAMES[month - 1];
  const canDelete = remaining === 0;

  return (
    <div className="container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {monthName} {year}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">Podroben pregled dela in plačil</p>
        </div>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteMonthDialog(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Izbriši mesec
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Work Information Card */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Informacije o delu</CardTitle>
                <CardDescription className="text-sm">Delovne ure in postavke za ta mesec</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditMonthOpen(true)} className="w-full sm:w-auto">
                Uredi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Opravljene ure</p>
                  <p className="text-xl sm:text-2xl font-bold">{record.workedHours.toString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Urna postavka</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatCurrency(record.hourlyRateCents)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Prevozni dodatek</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatCurrency(record.transportAllowanceCents)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 rounded-lg bg-muted/50 p-3 sm:p-4">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Ure × Postavka:</span>
                <span className="font-medium">
                  {formatCurrency(record.hourlyRateCents * record.workedHours)}
                </span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Prevoz:</span>
                <span className="font-medium">{formatCurrency(record.transportAllowanceCents)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm sm:text-base font-bold">
                <span>Skupaj za plačilo:</span>
                <span>{formatCurrency(record.totalDueCents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Card */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Plačila</CardTitle>
                <CardDescription className="text-sm">Sledite vsem prejetim plačilom</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddPaymentOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Dodaj plačilo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {record.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <div className="mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
                <p className="mb-1 text-sm sm:text-base font-medium">Še ni plačil</p>
                <p className="mb-4 text-xs sm:text-sm text-muted-foreground">
                  Dodajte prvo plačilo za začetek sledenja
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {record.payments.map((payment: Payment, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm sm:text-base font-semibold">{formatCurrency(payment.amountCents)}</p>
                        <Badge variant="outline" className="text-xs">
                          {payment.paymentType === 'bank' ? 'Banka' : 'Gotovina'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{formatDate(payment.date)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPaymentToDelete(payment.date)}
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="space-y-2 rounded-lg bg-muted/50 p-3 sm:p-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Skupaj za plačilo:</span>
                    <span className="font-medium">{formatCurrency(record.totalDueCents)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Plačano:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Preostalo:</span>
                    <span className={remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddPaymentDialog
        open={isAddPaymentOpen}
        onOpenChange={setIsAddPaymentOpen}
        month={month}
        year={year}
      />

      <EditMonthDialog
        open={isEditMonthOpen}
        onOpenChange={setIsEditMonthOpen}
        month={month}
        year={year}
        currentRecord={record}
      />

      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Izbriši plačilo</AlertDialogTitle>
            <AlertDialogDescription>
              Ali ste prepričani, da želite izbrisati to plačilo? Tega dejanja ni mogoče razveljaviti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Izbriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteMonthDialog} onOpenChange={setShowDeleteMonthDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Izbriši mesečni zapis</AlertDialogTitle>
            <AlertDialogDescription>
              Ali ste prepričani, da želite izbrisati ta mesečni zapis? Tega dejanja ni mogoče razveljaviti.
              Vsa plačila za ta mesec bodo prav tako izbrisana.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMonth}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Izbriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
