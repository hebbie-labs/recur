package ch.noseryoung.domain.recur.group.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.group.model.TaskGroup;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByGroup(TaskGroup group);

    List<Project> findByGroupIn(Collection<TaskGroup> groups);

    Optional<Project> findByIdAndGroup(UUID id, TaskGroup group);

    void deleteByGroup(TaskGroup group);
}
