package ch.noseryoung.domain.recur.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.auth.model.PasswordResetToken;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findFirstByUserIdOrderByDateCreatedDesc(UUID userId);

    // Custom @Modifying queries, unlike the CRUD methods JpaRepository provides
    // (delete(), save(), ...), don't inherit SimpleJpaRepository's built-in
    // @Transactional - they need their own, or they fail at runtime with
    // "No active transaction for update or delete query".
    @Transactional
    @Modifying
    @Query("delete from PasswordResetToken t where t.user.id = :userId")
    void deleteByUserId(UUID userId);
}
