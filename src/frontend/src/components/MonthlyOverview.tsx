import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { useAllRecords, useDeleteMonthlyRecord } from '../hooks/useQueries';
import { CreateMonthDialog } from './CreateMonthDialog';
import { useState } from 'react';
import { toast } from 'sonner';
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

interface MonthlyOverviewProps {
  onViewMonth: (month: number, year: number) => void;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'
];

function formatCurrency(cents: bigint): string {
  const euros = Number(cents) / 100;
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

function calculateTotals(record: any) {
  const totalPaid = record.payments.reduce((sum: number, payment: any) => {
    return sum + Number(payment.amountCents);
  }, 0);
  const remaining = Number(record.totalDueCents) - totalPaid;
  return { totalPaid, remaining };
}

export function MonthlyOverview({ onViewMonth }: MonthlyOverviewProps) {
  const { data: records, isLoading } = useAllRecords();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<{ month: number; year: number } | null>(null);
  const deleteMonthMutation = useDeleteMonthlyRecord();

  const handleDeleteMonth = async () => {
    if (!monthToDelete) return;
    
    try {
      await deleteMonthMutation.mutateAsync({
        month: monthToDelete.month,
        year: monthToDelete.year,
      });
      toast.success('Mesečni zapis uspešno izbrisan');
      setMonthToDelete(null);
    } catch (error: any) {
      if (error.message?.includes('unpaid balance')) {
        toast.error('Meseca ni mogoče izbrisati, ker ima neporavnan saldo');
      } else {
        toast.error('Napaka pri brisanju mesečnega zapisa');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const sortedRecords = [...(records || [])].sort((a, b) => {
    if (Number(a.year) !== Number(b.year)) {
      return Number(b.year) - Number(a.year);
    }
    return Number(b.month) - Number(a.month);
  });

  return (
    <div className="container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Mesečni zapisi</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Sledite svojim delovnim uram in plačilom</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nov mesec
        </Button>
      </div>

      {sortedRecords.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-base sm:text-lg font-semibold">Še ni zapisov</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
              Začnite z ustvarjanjem prvega mesečnega zapisa
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Ustvari prvi zapis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRecords.map((record) => {
            const { totalPaid, remaining } = calculateTotals(record);
            const monthName = MONTH_NAMES[Number(record.month) - 1];
            const isPaid = remaining <= 0;
            const canDelete = remaining === 0;

            return (
              <Card 
                key={`${record.month}-${record.year}`}
                className="transition-all hover:shadow-md"
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div 
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => onViewMonth(Number(record.month), Number(record.year))}
                    >
                      <CardTitle className="text-lg sm:text-xl truncate">{monthName} {record.year.toString()}</CardTitle>
                      <CardDescription className="text-sm">{record.workedHours.toString()} ur dela</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant={isPaid ? 'default' : 'secondary'} className="text-xs">
                        {isPaid ? 'Plačano' : 'V teku'}
                      </Badge>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMonthToDelete({ month: Number(record.month), year: Number(record.year) });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent 
                  className="cursor-pointer pt-0"
                  onClick={() => onViewMonth(Number(record.month), Number(record.year))}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Skupaj za plačilo:</span>
                      <span className="font-semibold">{formatCurrency(record.totalDueCents)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Plačano:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(BigInt(totalPaid))}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-base sm:text-lg font-bold">
                      <span>Preostalo:</span>
                      <span className={remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                        {formatCurrency(BigInt(remaining))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateMonthDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <AlertDialog open={!!monthToDelete} onOpenChange={() => setMonthToDelete(null)}>
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
