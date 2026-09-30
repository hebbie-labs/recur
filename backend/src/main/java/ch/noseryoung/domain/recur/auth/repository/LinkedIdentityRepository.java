package ch.noseryoung.domain.recur.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.auth.model.LinkedIdentity;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;

@Repository
public interface LinkedIdentityRepository extends JpaRepository<LinkedIdentity, UUID> {
    // "user" ist LAZY; OAuth2AccountLinkingService#resolve gibt ihn über die
    // Transaktionsgrenze hinaus zurück (LoggedIn), ein Proxy würde dort mit
    // LazyInitializationException scheitern.
    @EntityGraph(attributePaths = "user")
    Optional<LinkedIdentity> findByProviderAndSubjectId(AuthProvider provider, String subjectId);

    @Modifying
    @Query("delete from LinkedIdentity i where i.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
