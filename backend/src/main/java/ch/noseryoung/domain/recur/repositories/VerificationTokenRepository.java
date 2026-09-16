package ch.noseryoung.domain.recur.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.models.VerificationToken;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findFirstByUserIdOrderByDateCreatedDesc(UUID userId);

    @Modifying
    @Query("delete from VerificationToken t where t.user.id = :userId")
    void deleteByUserId(UUID userId);
}
