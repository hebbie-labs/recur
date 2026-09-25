package ch.noseryoung.domain.recur.task.service;

import org.springframework.stereotype.Component;

import ch.noseryoung.domain.recur.task.enums.Frequency;
import ch.noseryoung.domain.recur.task.model.Task;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.EnumMap;

@Component
public class TaskUtil {

    private EnumMap<Frequency, Integer> frequencies = new EnumMap<>(Frequency.class);

    public TaskUtil() {
        frequencies.put(Frequency.DAILY, 1);
        frequencies.put(Frequency.WEEKLY, 7);
        frequencies.put(Frequency.MONTHLY, 30);
        frequencies.put(Frequency.YEARLY, 365);
    }

    public Integer getFrequencyNumber(Frequency frequency) {
        return frequencies.get(frequency);
    }

    public static void calculateDaysInSpan(Task task) {
        if (task.getDateUntil() != null && task.getDateCreated() != null) {
            long daysBetween = Duration.between(task.getDateCreated(), task.getDateUntil()).toDays();
            task.setDaysInSpan((int) daysBetween);
        }
    }

    /** Berechnet den Progress als amountDid / erwartete Wiederholungen (daysInSpan / intervalDays) * 100, NICHT auf Basis verstrichener Zeit - jeder Klick auf "abhaken" steigert den Progress um einen fixen Betrag, unabhängig vom aktuellen Tag der Task-Laufzeit. */
    public void calculateProgress(Task task) {
        if (task.getAmountDid() == null || task.getFrequency() == null) {
            task.setProgress(0.0);
            return;
        }

        // ONCE ist nicht in `frequencies` enthalten und daher nicht als Bruchteil erwarteter Wiederholungen berechenbar (nur erledigt/nicht) - unabhängig von daysInSpan, sonst fiele z.B. ein Task mit Start = Fälligkeitsdatum faelschlicherweise durch die daysInSpan<=0-Guard auf 0%.
        if (task.getFrequency() == Frequency.ONCE) {
            task.setProgress(task.getAmountDid() > 0 ? 100.0 : 0.0);
            return;
        }

        if (task.getDaysInSpan() == null || task.getDaysInSpan() <= 0) {
            task.setProgress(0.0);
            return;
        }

        Integer intervalDays = getFrequencyNumber(task.getFrequency());
        if (intervalDays == null || intervalDays <= 0) {
            task.setProgress(0.0);
            return;
        }

        double expectedRepsTotal = (double) task.getDaysInSpan() / intervalDays;
        double progress = (task.getAmountDid() / expectedRepsTotal) * 100.0;

        task.setProgress(progress);
    }

    /** Migriert den alten amountDid-Zähler von Bestandstasks (vor #152) einmalig lazy in synthetische Completions, damit ihr Fortschritt nicht auf 0 zurückfällt; no-op sobald das Set eine echte Completion enthält - MUSS daher vor jeder Mutation des Sets aufgerufen werden, sonst würde ein zwischenzeitlich geleertes Set eine gerade entfernte Completion sofort wieder zurückschreiben. */
    public void backfillLegacyCompletionsIfNeeded(Task task) {
        if (!task.getCompletions().isEmpty()) {
            return;
        }
        backfillLegacyCompletions(task);
    }

    /** Leitet amountDid/lastAmountDidAt unbedingt aus dem aktuellen Completion-Set ab (#152), inkl. Zurücksetzen auf 0/null wenn leer. */
    public void deriveFromCompletions(Task task) {
        task.setAmountDid(task.getCompletions().size());
        task.setLastAmountDidAt(
                task.getCompletions().stream()
                        .max(Comparator.naturalOrder())
                        .map(date -> date.atStartOfDay(ZoneOffset.UTC).toInstant())
                        .orElse(null));
    }

    /** Convenience für reine Lesepfade: Backfill (falls nötig) + Ableitung in einem Schritt. */
    public void syncCompletions(Task task) {
        backfillLegacyCompletionsIfNeeded(task);
        deriveFromCompletions(task);
    }

    private void backfillLegacyCompletions(Task task) {
        if (task.getAmountDid() == null || task.getAmountDid() <= 0) {
            return;
        }

        Instant anchor = task.getLastAmountDidAt() != null ? task.getLastAmountDidAt() : task.getDateCreated();
        LocalDate anchorDate = anchor != null
                ? anchor.atZone(ZoneOffset.UTC).toLocalDate()
                : LocalDate.now(ZoneOffset.UTC);

        if (task.getFrequency() == Frequency.ONCE) {
            task.getCompletions().add(anchorDate);
            return;
        }

        Integer intervalDays = getFrequencyNumber(task.getFrequency());
        if (intervalDays == null) {
            return;
        }

        for (int i = 0; i < task.getAmountDid(); i++) {
            task.getCompletions().add(anchorDate.minusDays((long) i * intervalDays));
        }
    }

    /** Welches Frequenz-Intervall (gezählt seit dateCreated) ein Datum abdeckt - Basis für die Regel "max. 1 Completion pro Intervall" (#152); null bei ONCE oder fehlender Frequenz/dateCreated. */
    public Long intervalIndexOf(Task task, LocalDate date) {
        Integer intervalDays = getFrequencyNumber(task.getFrequency());
        if (intervalDays == null || task.getDateCreated() == null) {
            return null;
        }

        LocalDate createdDate = task.getDateCreated().atZone(ZoneOffset.UTC).toLocalDate();
        return Math.floorDiv(ChronoUnit.DAYS.between(createdDate, date), intervalDays);
    }
}