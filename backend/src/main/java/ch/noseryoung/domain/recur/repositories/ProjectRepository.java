package ch.noseryoung.domain.recur.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.models.TaskGroup;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByGroup(TaskGroup group);

    Optional<Project> findByIdAndGroup(UUID id, TaskGroup group);

    void deleteByGroup(TaskGroup group);
}
