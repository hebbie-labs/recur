package ch.noseryoung.domain.recur.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.auth.model.RefreshToken;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    // Custom @Modifying queries, unlike the CRUD methods JpaRepository provides
    // (delete(), save(), ...), don't inherit SimpleJpaRepository's built-in
    // @Transactional - they need their own, or they fail at runtime with
    // "No active transaction for update or delete query".
    @Transactional
    @Modifying
    @Query("delete from RefreshToken t where t.user.id = :userId")
    void deleteByUserId(UUID userId);

    // Diebstahl-Signal: der Reuse eines bereits rotierten Tokens revoked die
    // aktuell aktive Session mit derselben sessionId, siehe
    // RefreshTokenService#rotate.
    @Transactional
    @Modifying
    @Query("update RefreshToken t set t.revoked = true where t.sessionId = :sessionId and t.revoked = false")
    void revokeActiveBySessionId(UUID sessionId);
}
