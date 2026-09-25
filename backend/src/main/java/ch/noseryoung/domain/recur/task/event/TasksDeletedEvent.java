package ch.noseryoung.domain.recur.task.event;

import java.util.List;
import java.util.UUID;

// Published by TaskService before any of its task-delete paths (single task,
// deleteAllTasks, the ProjectsDeletedEvent listener) actually run the delete,
// so notification can clean up its NotificationLog rows first - task must not
// depend on notification's repository (previously handled via
// Task.notificationLogs' JPA cascade).
public record TasksDeletedEvent(List<UUID> taskIds) {
}
