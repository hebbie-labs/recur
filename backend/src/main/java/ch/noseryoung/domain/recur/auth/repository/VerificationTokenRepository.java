package ch.noseryoung.domain.recur.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.auth.model.VerificationToken;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findFirstByUserIdOrderByDateCreatedDesc(UUID userId);

    // Custom @Modifying queries, unlike the CRUD methods JpaRepository provides
    // (delete(), save(), ...), don't inherit SimpleJpaRepository's built-in
    // @Transactional - they need their own, or they fail at runtime with
    // "No active transaction for update or delete query".
    @Transactional
    @Modifying
    @Query("delete from VerificationToken t where t.user.id = :userId")
    void deleteByUserId(UUID userId);
}
