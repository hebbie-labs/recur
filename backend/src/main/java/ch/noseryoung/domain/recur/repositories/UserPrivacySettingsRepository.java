package ch.noseryoung.domain.recur.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.models.UserPrivacySettings;

@Repository
public interface UserPrivacySettingsRepository extends JpaRepository<UserPrivacySettings, UUID> {
    Optional<UserPrivacySettings> findByUserId(UUID userId);

    List<UserPrivacySettings> findByUserIdIn(Collection<UUID> userIds);
}
