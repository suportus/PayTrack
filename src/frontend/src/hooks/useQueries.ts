import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { MonthlyRecord, UserProfile } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAllRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyRecord[]>({
    queryKey: ['records'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlyRecord(month: number, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyRecord>({
    queryKey: ['record', month, year],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getMonthlyRecord(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHasExistingPayments(month: number, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasExistingPayments', month, year],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasExistingPayments(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrUpdateMonthlyRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      month, 
      year, 
      workedHours, 
      hourlyRateCents, 
      transportAllowanceCents 
    }: { 
      month: number; 
      year: number; 
      workedHours: number; 
      hourlyRateCents: number | null; 
      transportAllowanceCents: number | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createOrUpdateMonthlyRecord(
        BigInt(month),
        BigInt(year),
        BigInt(workedHours),
        hourlyRateCents !== null ? BigInt(hourlyRateCents) : null,
        transportAllowanceCents !== null ? BigInt(transportAllowanceCents) : null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['record'] });
    },
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      month, 
      year, 
      amountCents
    }: { 
      month: number; 
      year: number; 
      amountCents: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addPayment(
        BigInt(month),
        BigInt(year),
        BigInt(amountCents)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['record', variables.month, variables.year] });
      queryClient.invalidateQueries({ queryKey: ['hasExistingPayments', variables.month, variables.year] });
    },
  });
}

export function useDeletePayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      month, 
      year, 
      paymentDate 
    }: { 
      month: number; 
      year: number; 
      paymentDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deletePayment(
        BigInt(month),
        BigInt(year),
        paymentDate
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['record', variables.month, variables.year] });
      queryClient.invalidateQueries({ queryKey: ['hasExistingPayments', variables.month, variables.year] });
    },
  });
}

export function useDeleteMonthlyRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      month, 
      year 
    }: { 
      month: number; 
      year: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteMonthlyRecord(
        BigInt(month),
        BigInt(year)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}
