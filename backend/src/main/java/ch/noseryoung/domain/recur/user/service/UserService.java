package ch.noseryoung.domain.recur.user.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.user.dto.UserResponse;
import ch.noseryoung.domain.recur.user.event.UserDeletedEvent;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserPrivacySettingsRepository;
import ch.noseryoung.domain.recur.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher eventPublisher;

    public UserService(UserRepository userRepository, UserPrivacySettingsRepository privacySettingsRepository,
            CurrentUserService currentUserService, ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.privacySettingsRepository = privacySettingsRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
    }

    public UserResponse getCurrentUser() {
        return UserResponse.from(currentUserService.get());
    }

    public UserResponse updateCurrentUser(UserResponse userResponse) {
        User user = currentUserService.get();

        user.setFirstName(userResponse.firstName());
        user.setLastName(userResponse.lastName());
        user.setAvatarUrl(userResponse.avatarUrl());

        userRepository.save(user);

        return UserResponse.from(user);
    }

    public void deleteCurrentUser() {
        User user = currentUserService.get();

        // Muss vor dem User gelöscht werden, sonst schlägt der Delete an der
        // FK-Constraint von user_privacy_settings.user_id fehl.
        privacySettingsRepository.findByUserId(user.getId())
                .ifPresent(privacySettingsRepository::delete);

        // Räumt Referenzen in anderen Domains auf (Tokens/Sessions in auth,
        // NotificationSettings in notification, Task.createdBy/hiddenFor in
        // task) - siehe die jeweiligen @EventListener für UserDeletedEvent.
        // Muss synchron *vor* dem User-Delete passieren, sonst schlagen die
        // FK-Constraints dort fehl (Standard-@EventListener ist synchron im
        // selben Thread/derselben Transaktion). Bekannte Lücken siehe #230.
        eventPublisher.publishEvent(new UserDeletedEvent(user.getId()));

        userRepository.delete(user);
    }
}
