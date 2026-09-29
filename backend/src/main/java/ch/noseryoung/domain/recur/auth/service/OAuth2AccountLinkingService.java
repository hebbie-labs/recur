package ch.noseryoung.domain.recur.auth.service;

import java.util.Optional;

import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.auth.enums.OAuth2ErrorCode;
import ch.noseryoung.domain.recur.auth.enums.OAuth2Mode;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.auth.exceptions.OAuth2LinkExpiredException;
import ch.noseryoung.domain.recur.auth.model.LinkedIdentity;
import ch.noseryoung.domain.recur.auth.repository.LinkedIdentityRepository;
import ch.noseryoung.domain.recur.auth.security.oauth2.OAuth2Identity;
import ch.noseryoung.domain.recur.auth.security.oauth2.PendingOAuth2Link;
import ch.noseryoung.domain.recur.shared.service.EmailService;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.event.UserDeletedEvent;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;

// Entscheidet nach erfolgreicher Provider-Authentifizierung, welcher Recur-
// Account zur Provider-Identität gehört (#236, docs/AccountFlowChart.drawio).
// Aufgelöst wird über (provider, subjectId) statt über die E-Mail - der alte
// reine E-Mail-Match hat jeden mit passender verifizierter 3rd-Party-Mail
// ohne Besitznachweis in einen bestehenden lokalen Account eingeloggt.
@Service
public class OAuth2AccountLinkingService {

    private final UserRepository userRepository;
    private final LinkedIdentityRepository linkedIdentityRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public OAuth2AccountLinkingService(UserRepository userRepository,
            LinkedIdentityRepository linkedIdentityRepository, PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.linkedIdentityRepository = linkedIdentityRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public sealed interface Outcome permits LoggedIn, LinkRequired, Aborted {
    }

    public record LoggedIn(User user) implements Outcome {
    }

    // Es existiert bereits ein Account mit dieser E-Mail, der noch nicht mit
    // dieser Identität verknüpft ist - Nutzer muss erst bestätigen (und, falls
    // der Account ein Passwort hat, es eingeben).
    public record LinkRequired(PendingOAuth2Link pendingLink) implements Outcome {
    }

    public record Aborted(OAuth2ErrorCode code) implements Outcome {
    }

    public record LinkInfo(User user, boolean passwordRequired) {
    }

    @Transactional
    public Outcome resolve(OAuth2Identity identity, OAuth2Mode mode) {
        Optional<LinkedIdentity> linked = linkedIdentityRepository
                .findByProviderAndSubjectId(identity.provider(), identity.subjectId());

        if (linked.isPresent()) {
            // Register-Button soll nie stillschweigend in einen bestehenden
            // Account einloggen, sondern auf den Login verweisen.
            if (mode == OAuth2Mode.REGISTER) {
                return new Aborted(OAuth2ErrorCode.ACCOUNT_ALREADY_EXISTS);
            }
            return new LoggedIn(linked.get().getUser());
        }

        Optional<User> existing = userRepository.findByEmail(identity.email());
        if (existing.isPresent()) {
            return new LinkRequired(
                    new PendingOAuth2Link(existing.get().getId(), identity.provider(), identity.subjectId()));
        }

        return new LoggedIn(createUser(identity));
    }

    public LinkInfo describe(PendingOAuth2Link pendingLink) {
        User user = userRepository.findById(pendingLink.userId())
                .orElseThrow(OAuth2LinkExpiredException::new);
        return new LinkInfo(user, user.getPasswordHash() != null);
    }

    // Besitznachweis für den bestehenden Account: hat er ein Passwort, muss es
    // stimmen. Passwortlose Accounts sind selbst nur über einen Provider
    // entstanden - beide Seiten sind dann bereits provider-verifiziert, die
    // Bestätigung ("Verknüpfen") reicht.
    @Transactional
    public User confirmLink(PendingOAuth2Link pendingLink, String password) {
        User user = userRepository.findById(pendingLink.userId())
                .orElseThrow(OAuth2LinkExpiredException::new);

        if (user.getPasswordHash() != null
                && (password == null || !passwordEncoder.matches(password, user.getPasswordHash()))) {
            throw new InvalidCredentialsException();
        }

        Optional<LinkedIdentity> alreadyLinked = linkedIdentityRepository
                .findByProviderAndSubjectId(pendingLink.provider(), pendingLink.subjectId());
        if (alreadyLinked.isPresent()) {
            // Zwischenzeitlich (z.B. zweiter Tab) schon verknüpft - mit genau
            // diesem Account ist das harmlos, mit einem anderen nicht.
            if (!alreadyLinked.get().getUser().equals(user)) {
                throw new OAuth2LinkExpiredException();
            }
            return user;
        }

        link(user, pendingLink.provider(), pendingLink.subjectId());
        return user;
    }

    private User createUser(OAuth2Identity identity) {
        // Name/Avatar nur beim Anlegen übernehmen - spätere Logins
        // überschreiben nie, was der Nutzer in Recur selbst gesetzt hat.
        User user = userRepository.save(User.builder()
                .email(identity.email())
                .firstName(identity.firstName())
                .lastName(identity.lastName())
                .avatarUrl(identity.avatarUrl())
                .provider(identity.provider())
                .enabled(true)
                .emailVerified(true)
                .build());

        link(user, identity.provider(), identity.subjectId());

        String providerLabel = switch (identity.provider()) {
            case GOOGLE -> "Google";
            case GITHUB -> "GitHub";
            case LOCAL -> "Recur";
        };
        emailService.send(user.getEmail(), "Willkommen bei Recur",
                "Hallo " + user.getFirstName() + ",\n\n"
                        + "willkommen bei Recur! Dein Konto wurde erfolgreich über " + providerLabel + " erstellt.");

        return user;
    }

    private void link(User user, AuthProvider provider, String subjectId) {
        linkedIdentityRepository.save(LinkedIdentity.builder()
                .user(user)
                .provider(provider)
                .subjectId(subjectId)
                .build());
    }

    // Synchron vor dem User-Delete (siehe UserService#deleteCurrentUser), sonst
    // schlägt die FK-Constraint linked_identity.user_id fehl.
    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        linkedIdentityRepository.deleteByUserId(event.userId());
    }
}
