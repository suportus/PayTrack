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

import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
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

  public shared ({ caller }) func createOrUpdateMonthlyRecord(
    month : Month,
    year : Year,
    workedHours : Nat,
    hourlyRateCents : ?Nat,
    transportAllowanceCents : ?Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update monthly records");
    };
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
      case (?existing) { existing.payments };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payments");
    };
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();

    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access monthly records");
    };
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getAllRecords() : async [MonthlyRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access records");
    };
    let userRecordsMap = getUserRecords(caller);
    userRecordsMap.values().toArray().sort(MonthlyRecord.compareByDate);
  };

  public query ({ caller }) func getPaymentsForMonth(month : Month, year : Year) : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access payments");
    };
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { [] };
      case (?record) { record.payments.sort() };
    };
  };

  public query ({ caller }) func getSummary(month : Month, year : Year) : async (Nat, Nat, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access summaries");
    };
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { (0, 0, 0) };
      case (?record) {
        var totalPaid = 0;
        for (payment in record.payments.values()) {
          totalPaid += payment.amountCents;
        };
        let remaining = record.totalDueCents - totalPaid;
        (record.totalDueCents, totalPaid, remaining);
      };
    };
  };

  public query ({ caller }) func getAllSummaries() : async [(Month, Year, Nat, Nat, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access summaries");
    };
    let userRecordsMap = getUserRecords(caller);
    let summaries = List.empty<(Month, Year, Nat, Nat, Nat)>();

    for (record in userRecordsMap.values()) {
      var totalPaid = 0;
      for (payment in record.payments.values()) {
        totalPaid += payment.amountCents;
      };
      let remaining = record.totalDueCents - totalPaid;
      summaries.add((record.month, record.year, record.totalDueCents, totalPaid, remaining));
    };

    summaries.toArray();
  };

  public shared ({ caller }) func deletePayment(month : Month, year : Year, paymentDate : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete payments");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete monthly records");
    };
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();

    switch (userRecordsMap.get(recordId)) {
      case (null) { Runtime.trap("Monthly record does not exist") };
      case (?record) {
        var totalPaid = 0;
        for (payment in record.payments.values()) {
          totalPaid += payment.amountCents;
        };
        let remaining = record.totalDueCents - totalPaid;

        if (remaining != 0) {
          Runtime.trap("Cannot delete a month with unpaid balance");
        };

        userRecordsMap.remove(recordId);
        saveUserRecords(caller, userRecordsMap);
      };
    };
  };

  public query ({ caller }) func hasExistingPayments(month : Month, year : Year) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access payment information");
    };
    let userRecordsMap = getUserRecords(caller);
    let recordId = month.toText() # "-" # year.toText();
    switch (userRecordsMap.get(recordId)) {
      case (null) { false };
      case (?record) { record.payments.size() > 0 };
    };
  };
};
