package ch.noseryoung.domain.recur.notification.enums;

// Typ einer über NotificationLog (#102) deduplizierten Task-Benachrichtigung.
// Das "Neuer Projekt-Task erstellt"-Ereignis läuft bewusst NICHT hierüber,
// da es ein einmaliges Ereignis (kein wiederholtes Scheduler-Polling) ist.
public enum NotificationType {
    REMINDER,
    OVERDUE
}
