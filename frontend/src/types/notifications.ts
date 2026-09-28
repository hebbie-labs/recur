export type ReminderLeadTime =
  | "AT_DUE_TIME"
  | "ONE_HOUR"
  | "SIX_HOURS"
  | "TWENTY_FOUR_HOURS"
  | "THREE_DAYS";

export type NotificationSettings = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  reminderLeadTime: ReminderLeadTime;
};
