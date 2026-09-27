package ch.noseryoung.domain.recur.task.event;

import java.util.List;

import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.user.model.User;

// Published by TaskService#notifyGroupOfNewProjectTask instead of calling
// NotificationDispatchService directly - task must not depend on
// notification. Carries the already-loaded entities directly (same thread,
// same transaction, no serialization boundary) rather than ids, to avoid
// notification re-fetching them.
public record ProjectTaskCreatedEvent(Task task, User creator, List<User> recipients) {
}
