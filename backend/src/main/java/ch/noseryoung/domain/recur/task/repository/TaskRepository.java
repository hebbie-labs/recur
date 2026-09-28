package ch.noseryoung.domain.recur.task.repository;

import java.util.*;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.user.model.User;

import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    public List<Task> findByIsArchived(Boolean isArchived);

    public List<Task> findByIsFavorite(Boolean isFavorite);

    public List<Task> findByOwner(User owner);

    public List<Task> findByOwnerAndIsArchived(User owner, Boolean isArchived);

    public List<Task> findByOwnerAndIsFavorite(User owner, Boolean isFavorite);

    public Optional<Task> findByIdAndOwner(UUID id, User owner);

    public void deleteByOwner(User owner);

    public List<Task> findByProject(Project project);

    public List<Task> findByProjectIn(Collection<Project> projects);

    // Kandidaten für den Erinnerungs-/Überfällig-Scheduler (#102): nicht
    // archivierte Tasks mit einem Fälligkeitsdatum. Die Fenster-Prüfung
    // (Lead-Time, 1h/1 Tag überfällig) läuft danach in-memory im Scheduler,
    // da sie pro Empfänger unterschiedlich ausfallen kann (eigene
    // NotificationSettings je Gruppenmitglied).
    public List<Task> findByIsArchivedFalseAndDateUntilIsNotNull();

    public void deleteByProjectIn(Collection<Project> projects);

    // Sichtbar für einen User sind eigene persönliche Tasks (owner) sowie
    // geteilte Projekt-Tasks aller Gruppen, in denen der User Mitglied ist -
    // ausser er hat den Task für sich ausgeblendet (TaskService#deleteTask).
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN t.project p LEFT JOIN p.group g LEFT JOIN g.members m "
            + "WHERE (t.owner = :user OR m = :user) AND :user NOT MEMBER OF t.hiddenFor")
    public List<Task> findVisibleToUser(@Param("user") User user);

    // Konto-Löschung (AuthService#deleteCurrentUser): createdBy/hiddenFor
    // referenzieren den User per FK, müssen also vor dem Löschen aufgeräumt
    // werden. Fallback für createdBy = null ist der Gruppen-Admin (siehe
    // TaskService#isTaskCreator), ein gelöschter Task bleibt für die
    // verbleibenden Mitglieder bestehen.
    @Transactional
    @Modifying
    @Query("UPDATE Task t SET t.createdBy = null WHERE t.createdBy = :user")
    void clearCreatedBy(@Param("user") User user);

    // Für den Cleanup in AuthService#deleteCurrentUser: die Tasks laden statt
    // eine Bulk-Query auf der Join-Tabelle zu schreiben, damit kein natives
    // SQL nötig ist, das das gesetzte hibernate.default_schema umgehen würde.
    public List<Task> findByHiddenForContaining(User user);
}