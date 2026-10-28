import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Cycles "mo:core/Cycles";

actor PayTrack {
  // Only principals in this list may read or write data.
  // The list is managed by a canister controller (your icp identity).
  let allowedUsers = Map.empty<Principal, Bool>();

  // ---------- Access control ----------

  func requireUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous access is not allowed");
    };
    if (not allowedUsers.containsKey(caller)) {
      Runtime.trap("Access denied");
    };
  };

  func requireController(caller : Principal) {
    if (not caller.isController()) {
      Runtime.trap("Only a canister controller can do this");
    };
  };

  public shared ({ caller }) func addUser(user : Principal) : async () {
    requireController(caller);
    allowedUsers.add(user, true);
  };

  public shared ({ caller }) func removeUser(user : Principal) : async () {
    requireController(caller);
    allowedUsers.remove(user);
  };

  public shared ({ caller }) func listUsers() : async [Principal] {
    requireController(caller);
    allowedUsers.keys().toArray();
  };

  // Cycle balance of this (backend) canister, shown in the Cikli dialog.
  public shared query ({ caller }) func getCycleBalance() : async Nat {
    requireUser(caller);
    Cycles.balance();
  };

  // PayTrack Application Code
  type Month = Nat;
  type Year = Nat;

  type PaymentType = {
    #bank;
    #cash;
  };

  type Payment = {
    date : Time.Time;
    amountCents : Nat;
    paymentType : PaymentType;
  };

  module Payment {
    public func compare(p1 : Payment, p2 : Payment) : Order.Order {
      Int.compare(p1.date, p2.date);
    };
  };

  type MonthlyRecord = {
    month : Month;
    year : Year;
    workedHours : Nat;
    hourlyRateCents : Nat;
    transportAllowanceCents : Nat;
    totalDueCents : Nat;
    payments : [Payment];
  };

  module MonthlyRecord {
    public func compareByDate(r1 : MonthlyRecord, r2 : MonthlyRecord) : Order.Order {
      if (r1.year < r2.year) { return #less };
      if (r1.year > r2.year) { return #greater };
      if (r1.month < r2.month) { return #less };
      if (r1.month > r2.month) { return #greater };
      #equal;
    };
  };

  type UserProfile = {
    name : Text;
    defaultHourlyRateCents : Nat;
    defaultTransportAllowanceCents : Nat;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userRecords = Map.empty<Principal, Map.Map<Text, MonthlyRecord>>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Your own profile, or any profile for a canister controller.
    if (caller.isController()) {
      return userProfiles.get(user);
    };
    requireUser(caller);
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireUser(caller);
    userProfiles.add(caller, profile);
  };

  func getUserProfileInternal(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) {
        Runtime.trap("User profile not found. Please create your profile first.");
      };
    };
  };

  func getUserRecords(caller : Principal) : Map.Map<Text, MonthlyRecord> {
    switch (userRecords.get(caller)) {
      case (?records) { records };
      case (null) { Map.empty<Text, MonthlyRecord>() };
    };
  };

  func saveUserRecords(caller : Principal, records : Map.Map<Text, MonthlyRecord>) {
    userRecords.add(caller, records);
  };

  func totalPaidOf(record : MonthlyRecord) : Nat {
    var totalPaid = 0;
    for (payment in record.payments.values()) {
      totalPaid += payment.amountCents;
    };
    totalPaid;
  };

  // addPayment and createOrUpdateMonthlyRecord keep total paid <= total due,
  // so this never goes below zero; the check only guards against old data.
  func remainingOf(record : MonthlyRecord) : Nat {
    let totalPaid = totalPaidOf(record);
    if (totalPaid >= record.totalDueCents) { 0 } else {
      record.totalDueCents - totalPaid;
    };
  };

  // Cents as Slovenian EUR text for error messages, e.g. 123456 -> "1234,56 €".
  func formatEur(cents : Nat) : Text {
    let rest = cents % 100;
    let restText = if (rest < 10) { "0" # rest.toText() } else { rest.toText() };
    (cents / 100).toText() # "," # restText # " €";
  };

  public shared ({ caller }) func createOrUpdateMonthlyRecord(
    month : Month,
    year : Year,
    workedHours : Nat,
    hourlyRateCents : ?Nat,
    transportAllowanceCents : ?Nat,
  ) : async () {
    requireUser(caller);
    let userProfile = getUserProfileInternal(caller);
    let recordId = month.toText() # "-" # year.toText();

    let hourlyRate = switch (hourlyRateCents) {
      case (null) { userProfile.defaultHourlyRateCents };
      case (?rate) { rate };
    };

    let transportAllowance = switch (transportAllowanceCents) {
      case (null) { userProfile.defaultTransportAllowanceCents };
      case (?allowance) { allowance };
    };

    let totalDue = hourlyRate * workedHours + transportAllowance;
    let userRecordsMap = getUserRecords(caller);

    let payments = switch (userRecordsMap.get(recordId)) {
      case (null) { List.empty<Payment>().toArray() };
      case (?existing) {
        let totalPaid = totalPaidOf(existing);
        if (totalDue < totalPaid) {
          Runtime.trap(
            "Skupni znesek (" # formatEur(totalDue) # ") ne sme biti manjši od že plačanega zneska (" # formatEur(totalPaid) # ")."
          );
        };
        existing.payments;
      };
    };

    let record : MonthlyRecord = {
      month;
      year;
      workedHours;
      hourlyRateCents = hourlyRate;
      transportAllowanceCents = transportAllowance;
      totalDueCents = totalDue;
      payments;
    };

    userRecordsMap.add(recordId, record);
    saveUserRecords(caller, userRecordsMap);
  };

  public shared ({ caller }) func addPayment(month : Month, year : Year, amountCents : Nat) : async () {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();

    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) {
        let remaining = remainingOf(record);
        if (amountCents > remaining) {
          Runtime.trap(
            "Plačilo (" # formatEur(amountCents) # ") presega preostali znesek (" # formatEur(remaining) # ")."
          );
        };
        let paymentType = if (record.payments.size() == 0) { #bank } else { #cash };
        let payment : Payment = {
          date = Time.now();
          amountCents;
          paymentType;
        };

        let payments = List.fromArray<Payment>(record.payments);
        payments.add(payment);

        let updatedRecord : MonthlyRecord = {
          month = record.month;
          year = record.year;
          workedHours = record.workedHours;
          hourlyRateCents = record.hourlyRateCents;
          transportAllowanceCents = record.transportAllowanceCents;
          totalDueCents = record.totalDueCents;
          payments = payments.toArray().sort();
        };

        userRecordsMap.add(recordId, updatedRecord);
        saveUserRecords(caller, userRecordsMap);
      };
    };
  };

  public query ({ caller }) func getMonthlyRecord(month : Month, year : Year) : async MonthlyRecord {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getAllRecords() : async [MonthlyRecord] {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    userRecordsMap.values().toArray().sort(MonthlyRecord.compareByDate);
  };

  public query ({ caller }) func getPaymentsForMonth(month : Month, year : Year) : async [Payment] {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { [] };
      case (?record) { record.payments.sort() };
    };
  };

  public query ({ caller }) func getSummary(month : Month, year : Year) : async (Nat, Nat, Nat) {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { (0, 0, 0) };
      case (?record) {
        (record.totalDueCents, totalPaidOf(record), remainingOf(record));
      };
    };
  };

  public query ({ caller }) func getAllSummaries() : async [(Month, Year, Nat, Nat, Nat)] {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let summaries = List.empty<(Month, Year, Nat, Nat, Nat)>();

    for (record in userRecordsMap.values()) {
      summaries.add((record.month, record.year, record.totalDueCents, totalPaidOf(record), remainingOf(record)));
    };

    summaries.toArray();
  };

  public shared ({ caller }) func deletePayment(month : Month, year : Year, paymentDate : Time.Time) : async () {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) {
        let updatedPayments = record.payments.filter(
          func(p) {
            p.date != paymentDate;
          }
        );
        let updatedRecord : MonthlyRecord = {
          month = record.month;
          year = record.year;
          workedHours = record.workedHours;
          hourlyRateCents = record.hourlyRateCents;
          transportAllowanceCents = record.transportAllowanceCents;
          totalDueCents = record.totalDueCents;
          payments = updatedPayments;
        };

        userRecordsMap.add(recordId, updatedRecord);
        saveUserRecords(caller, userRecordsMap);
      };
    };
  };

  public shared ({ caller }) func deleteMonthlyRecord(month : Month, year : Year) : async () {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();

    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) {
        if (remainingOf(record) != 0) {
          Runtime.trap("Cannot delete a month with unpaid balance");
        };

        userRecordsMap.remove(recordId);
        saveUserRecords(caller, userRecordsMap);
      };
    };
  };

  public query ({ caller }) func hasExistingPayments(month : Month, year : Year) : async Bool {
    requireUser(caller);
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { false };
      case (?record) { record.payments.size() > 0 };
    };
  };
};
