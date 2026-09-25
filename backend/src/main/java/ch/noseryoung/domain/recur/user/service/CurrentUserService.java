package ch.noseryoung.domain.recur.user.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;

// Ersetzt die früher pro Service kopierte getCurrentUser()-Methode
// (TaskService, GroupService, ProjectService, PushSubscriptionService,
// NotificationSettingsService, PrivacySettingsService, AuthService). Nutzt
// SecurityContextHolder#getName() (= E-Mail, siehe CustomUserDetails#getUsername)
// statt den Principal auf CustomUserDetails zu casten, damit Domains ausserhalb
// von auth nicht von auth.security abhängen müssen.
// ponytail: eine indizierte findByEmail-Query pro Request, bei Bedarf cachen.
@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User get() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authentifizierter User nicht gefunden: " + email));
    }
}
