package ch.noseryoung.domain.recur.notification.repository;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.notification.enums.NotificationType;
import ch.noseryoung.domain.recur.notification.model.NotificationLog;
import ch.noseryoung.domain.recur.user.model.User;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    boolean existsByTaskAndRecipientAndType(Task task, User recipient, NotificationType type);

    // Ersetzt Task.notificationLogs (Cascade REMOVE) - task darf nicht von
    // notification abhängen, siehe TaskService's TasksDeletedEvent.
    @Modifying
    void deleteByTaskIdIn(Collection<UUID> taskIds);
}
