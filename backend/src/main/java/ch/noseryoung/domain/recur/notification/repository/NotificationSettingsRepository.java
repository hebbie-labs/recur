package ch.noseryoung.domain.recur.notification.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ch.noseryoung.domain.recur.notification.model.NotificationSettings;

@Repository
public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, UUID> {
    Optional<NotificationSettings> findByUserId(UUID userId);
}
