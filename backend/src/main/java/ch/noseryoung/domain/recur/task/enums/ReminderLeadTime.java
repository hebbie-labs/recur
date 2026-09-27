package ch.noseryoung.domain.recur.task.enums;

import java.time.Duration;

// Wie lange vor Task.dateUntil die Erinnerungs-Benachrichtigung (#102)
// verschickt wird - nutzerkonfigurierbar über NotificationSettings.
public enum ReminderLeadTime {
    AT_DUE_TIME(Duration.ZERO),
    ONE_HOUR(Duration.ofHours(1)),
    SIX_HOURS(Duration.ofHours(6)),
    TWENTY_FOUR_HOURS(Duration.ofHours(24)),
    THREE_DAYS(Duration.ofDays(3));

    private final Duration leadTime;

    ReminderLeadTime(Duration leadTime) {
        this.leadTime = leadTime;
    }

    public Duration getLeadTime() {
        return leadTime;
    }
}
