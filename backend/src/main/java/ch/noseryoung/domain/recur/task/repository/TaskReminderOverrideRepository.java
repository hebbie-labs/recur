package ch.noseryoung.domain.recur.task.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.task.model.TaskReminderOverride;
import ch.noseryoung.domain.recur.user.model.User;

@Repository
public interface TaskReminderOverrideRepository extends JpaRepository<TaskReminderOverride, UUID> {
    Optional<TaskReminderOverride> findByTaskAndUser(Task task, User user);
}
