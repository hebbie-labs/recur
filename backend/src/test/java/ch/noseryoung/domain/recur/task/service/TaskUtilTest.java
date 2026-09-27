package ch.noseryoung.domain.recur.task.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import ch.noseryoung.domain.recur.task.enums.Frequency;
import ch.noseryoung.domain.recur.task.model.Task;

/**
 * Deckt die Fortschritts-/Zeitspannen-Berechnung ab - das Kernstück der
 * Habit-Tracking-Logik. Enthaelt insbesondere den Regressionstest fuer den
 * Bug, bei dem Frequency.ONCE (in der Intervall-Tabelle nicht vorhanden) den
 * Fortschritt einmaliger Termine bei jedem Update wieder auf 0% zuruecksetzte.
 */
class TaskUtilTest {

    private final TaskUtil taskUtil = new TaskUtil();

    @Test
    void calculateDaysInSpan_setsDaysBetweenCreatedAndUntil() {
        Task task = Task.builder()
                .dateCreated(Instant.parse("2026-01-01T00:00:00Z"))
                .dateUntil(Instant.parse("2026-01-11T00:00:00Z"))
                .build();

        TaskUtil.calculateDaysInSpan(task);

        assertThat(task.getDaysInSpan()).isEqualTo(10);
    }

    @Test
    void calculateDaysInSpan_leavesFieldUntouchedWhenDateUntilMissing() {
        Task task = Task.builder()
                .dateCreated(Instant.now())
                .dateUntil(null)
                .build();

        TaskUtil.calculateDaysInSpan(task);

        assertThat(task.getDaysInSpan()).isNull();
    }

    @Test
    void calculateProgress_onceTaskNotYetDone_isZeroPercent() {
        Task task = onceTask(0);

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(0.0);
    }

    @Test
    void calculateProgress_onceTaskMarkedDone_isFullyComplete() {
        Task task = onceTask(1);

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(100.0);
    }

    @Test
    void calculateProgress_onceTaskDoesNotOverflowPast100OnRepeatedClicks() {
        Task task = onceTask(5);

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(100.0);
    }

    @ParameterizedTest(name = "{0}: daysInSpan={1}, amountDid={2} -> {3}%")
    @CsvSource({
            "DAILY, 10, 5, 50.0",
            "WEEKLY, 70, 2, 20.0",
            "MONTHLY, 90, 3, 100.0",
            "YEARLY, 365, 1, 100.0",
    })
    void calculateProgress_recurringFrequencies_computeExpectedShare(
            Frequency frequency, int daysInSpan, int amountDid, double expectedProgress) {
        Task task = Task.builder()
                .frequency(frequency)
                .daysInSpan(daysInSpan)
                .amountDid(amountDid)
                .build();

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isCloseTo(expectedProgress, within(0.0001));
    }

    @Test
    void calculateProgress_missingAmountDid_isZero() {
        Task task = Task.builder()
                .frequency(Frequency.DAILY)
                .daysInSpan(10)
                .amountDid(null)
                .build();

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(0.0);
    }

    @Test
    void calculateProgress_missingFrequency_isZero() {
        Task task = Task.builder()
                .frequency(null)
                .daysInSpan(10)
                .amountDid(1)
                .build();

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(0.0);
    }

    @Test
    void calculateProgress_onceTaskWithZeroDaysInSpan_isStillFullyComplete() {
        // Start- und Fälligkeitsdatum am selben Tag (z.B. Task via Kalender
        // Tages-Klick angelegt) => daysInSpan=0. ONCE darf davon unabhängig sein.
        Task task = Task.builder()
                .frequency(Frequency.ONCE)
                .daysInSpan(0)
                .amountDid(1)
                .build();

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(100.0);
    }

    @Test
    void calculateProgress_zeroOrNegativeDaysInSpan_isZero() {
        Task task = Task.builder()
                .frequency(Frequency.DAILY)
                .daysInSpan(0)
                .amountDid(1)
                .build();

        taskUtil.calculateProgress(task);

        assertThat(task.getProgress()).isEqualTo(0.0);
    }

    private static Task onceTask(int amountDid) {
        Instant created = Instant.now();
        return Task.builder()
                .frequency(Frequency.ONCE)
                .dateCreated(created)
                .dateUntil(created.plus(30, ChronoUnit.DAYS))
                .daysInSpan(30)
                .amountDid(amountDid)
                .build();
    }
}
