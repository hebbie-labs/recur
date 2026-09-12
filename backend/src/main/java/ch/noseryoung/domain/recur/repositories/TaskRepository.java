package ch.noseryoung.domain.recur.repositories;

import java.util.*;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.models.Task;
import ch.noseryoung.domain.recur.models.User;

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

    public void deleteByProjectIn(Collection<Project> projects);

    // Sichtbar für einen User sind eigene persönliche Tasks (owner) sowie
    // geteilte Projekt-Tasks aller Gruppen, in denen der User Mitglied ist.
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN t.project p LEFT JOIN p.group g LEFT JOIN g.members m "
            + "WHERE t.owner = :user OR m = :user")
    public List<Task> findVisibleToUser(@Param("user") User user);
}