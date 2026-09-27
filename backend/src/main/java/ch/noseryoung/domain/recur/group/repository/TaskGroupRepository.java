package ch.noseryoung.domain.recur.group.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.group.model.TaskGroup;

@Repository
public interface TaskGroupRepository extends JpaRepository<TaskGroup, UUID> {

    @Query("SELECT g FROM TaskGroup g JOIN g.members m WHERE m = :member")
    List<TaskGroup> findByMembersContaining(@Param("member") User member);

    Optional<TaskGroup> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);
}
