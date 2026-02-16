import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Year = bigint;
export type Time = bigint;
export interface Payment {
    date: Time;
    amountCents: bigint;
    paymentType: PaymentType;
}
export type Month = bigint;
export interface MonthlyRecord {
    month: Month;
    payments: Array<Payment>;
    workedHours: bigint;
    transportAllowanceCents: bigint;
    year: Year;
    hourlyRateCents: bigint;
    totalDueCents: bigint;
}
export interface UserProfile {
    name: string;
    defaultHourlyRateCents: bigint;
    defaultTransportAllowanceCents: bigint;
}
export enum PaymentType {
    bank = "bank",
    cash = "cash"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPayment(month: Month, year: Year, amountCents: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateMonthlyRecord(month: Month, year: Year, workedHours: bigint, hourlyRateCents: bigint | null, transportAllowanceCents: bigint | null): Promise<void>;
    deleteMonthlyRecord(month: Month, year: Year): Promise<void>;
    deletePayment(month: Month, year: Year, paymentDate: Time): Promise<void>;
    getAllRecords(): Promise<Array<MonthlyRecord>>;
    getAllSummaries(): Promise<Array<[Month, Year, bigint, bigint, bigint]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMonthlyRecord(month: Month, year: Year): Promise<MonthlyRecord>;
    getPaymentsForMonth(month: Month, year: Year): Promise<Array<Payment>>;
    getSummary(month: Month, year: Year): Promise<[bigint, bigint, bigint]>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasExistingPayments(month: Month, year: Year): Promise<boolean>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
