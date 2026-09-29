package ch.noseryoung.domain.recur.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import ch.noseryoung.domain.recur.auth.enums.OAuth2ErrorCode;
import ch.noseryoung.domain.recur.auth.enums.OAuth2Mode;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.auth.exceptions.OAuth2LinkExpiredException;
import ch.noseryoung.domain.recur.auth.model.LinkedIdentity;
import ch.noseryoung.domain.recur.auth.repository.LinkedIdentityRepository;
import ch.noseryoung.domain.recur.auth.security.oauth2.OAuth2Identity;
import ch.noseryoung.domain.recur.auth.security.oauth2.PendingOAuth2Link;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.Aborted;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.LinkRequired;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.LoggedIn;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.Outcome;
import ch.noseryoung.domain.recur.shared.service.EmailService;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;

/**
 * Deckt die Account-Verknüpfungslogik aus #236 ab (docs/AccountFlowChart.drawio):
 * Auflösung über die Provider-Subject-ID statt die E-Mail, und vor allem, dass
 * ein E-Mail-Treffer NIE direkt einloggt, sondern eine Bestätigung verlangt -
 * das war die Account-Takeover-Lücke.
 */
@ExtendWith(MockitoExtension.class)
class OAuth2AccountLinkingServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private LinkedIdentityRepository linkedIdentityRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private OAuth2AccountLinkingService service;

    private final OAuth2Identity googleIdentity = new OAuth2Identity(
            AuthProvider.GOOGLE, "google-sub-1", "user@example.com", "Max", "Muster", "https://avatar");

    @BeforeEach
    void setUp() {
        service = new OAuth2AccountLinkingService(userRepository, linkedIdentityRepository, passwordEncoder,
                emailService);
    }

    private User user(String passwordHash) {
        return User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .firstName("Lokal")
                .passwordHash(passwordHash)
                .build();
    }

    private void identityLinkedTo(User user) {
        when(linkedIdentityRepository.findByProviderAndSubjectId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(LinkedIdentity.builder()
                        .user(user).provider(AuthProvider.GOOGLE).subjectId("google-sub-1").build()));
    }

    private void identityNotLinked() {
        when(linkedIdentityRepository.findByProviderAndSubjectId(AuthProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.empty());
    }

    @Test
    void resolve_logsInWhenIdentityAlreadyLinked() {
        User user = user("hash");
        identityLinkedTo(user);

        Outcome outcome = service.resolve(googleIdentity, OAuth2Mode.LOGIN);

        assertThat(outcome).isEqualTo(new LoggedIn(user));
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void resolve_abortsRegisterWhenIdentityAlreadyLinked() {
        identityLinkedTo(user("hash"));

        Outcome outcome = service.resolve(googleIdentity, OAuth2Mode.REGISTER);

        assertThat(outcome).isEqualTo(new Aborted(OAuth2ErrorCode.ACCOUNT_ALREADY_EXISTS));
    }

    // Kern der Takeover-Lücke: gleiche E-Mail darf nicht direkt einloggen.
    @Test
    void resolve_requiresLinkConfirmationWhenEmailMatchesExistingAccount() {
        User existing = user("hash");
        identityNotLinked();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));

        Outcome outcome = service.resolve(googleIdentity, OAuth2Mode.LOGIN);

        assertThat(outcome).isEqualTo(new LinkRequired(
                new PendingOAuth2Link(existing.getId(), AuthProvider.GOOGLE, "google-sub-1")));
        verify(linkedIdentityRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void resolve_requiresLinkConfirmationAlsoForRegisterButton() {
        User existing = user(null);
        identityNotLinked();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));

        Outcome outcome = service.resolve(googleIdentity, OAuth2Mode.REGISTER);

        assertThat(outcome).isInstanceOf(LinkRequired.class);
    }

    @Test
    void resolve_createsPasswordlessAccountAndLinksIdentityWhenNothingMatches() {
        identityNotLinked();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Outcome outcome = service.resolve(googleIdentity, OAuth2Mode.REGISTER);

        assertThat(outcome).isInstanceOf(LoggedIn.class);
        User created = ((LoggedIn) outcome).user();
        assertThat(created.getEmail()).isEqualTo("user@example.com");
        assertThat(created.getFirstName()).isEqualTo("Max");
        assertThat(created.getPasswordHash()).isNull();
        assertThat(created.getProvider()).isEqualTo(AuthProvider.GOOGLE);

        ArgumentCaptor<LinkedIdentity> linked = ArgumentCaptor.forClass(LinkedIdentity.class);
        verify(linkedIdentityRepository).save(linked.capture());
        assertThat(linked.getValue().getSubjectId()).isEqualTo("google-sub-1");
        assertThat(linked.getValue().getUser()).isSameAs(created);
        verify(emailService).send(eq("user@example.com"), anyString(), anyString());
    }

    // Name/Avatar werden bei späteren Logins nicht mehr überschrieben.
    @Test
    void resolve_doesNotOverwriteProfileOfLinkedAccount() {
        User user = user("hash");
        identityLinkedTo(user);

        service.resolve(googleIdentity, OAuth2Mode.LOGIN);

        assertThat(user.getFirstName()).isEqualTo("Lokal");
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmLink_requiresCorrectPasswordForAccountWithPassword() {
        User existing = user("hash");
        PendingOAuth2Link pending = new PendingOAuth2Link(existing.getId(), AuthProvider.GOOGLE, "google-sub-1");
        when(userRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.confirmLink(pending, "wrong"))
                .isInstanceOf(InvalidCredentialsException.class);
        verify(linkedIdentityRepository, never()).save(any());
    }

    @Test
    void confirmLink_rejectsMissingPasswordForAccountWithPassword() {
        User existing = user("hash");
        PendingOAuth2Link pending = new PendingOAuth2Link(existing.getId(), AuthProvider.GOOGLE, "google-sub-1");
        when(userRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.confirmLink(pending, null))
                .isInstanceOf(InvalidCredentialsException.class);
        verify(linkedIdentityRepository, never()).save(any());
    }

    @Test
    void confirmLink_linksAfterCorrectPassword() {
        User existing = user("hash");
        PendingOAuth2Link pending = new PendingOAuth2Link(existing.getId(), AuthProvider.GOOGLE, "google-sub-1");
        when(userRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("secret123", "hash")).thenReturn(true);
        identityNotLinked();

        User result = service.confirmLink(pending, "secret123");

        assertThat(result).isSameAs(existing);
        verify(linkedIdentityRepository).save(any(LinkedIdentity.class));
    }

    @Test
    void confirmLink_linksPasswordlessAccountWithoutPassword() {
        User existing = user(null);
        PendingOAuth2Link pending = new PendingOAuth2Link(existing.getId(), AuthProvider.GOOGLE, "google-sub-1");
        when(userRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        identityNotLinked();

        User result = service.confirmLink(pending, null);

        assertThat(result).isSameAs(existing);
        verify(linkedIdentityRepository).save(any(LinkedIdentity.class));
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void confirmLink_rejectsIdentityMeanwhileLinkedToOtherAccount() {
        User existing = user(null);
        PendingOAuth2Link pending = new PendingOAuth2Link(existing.getId(), AuthProvider.GOOGLE, "google-sub-1");
        when(userRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        identityLinkedTo(user(null));

        assertThatThrownBy(() -> service.confirmLink(pending, null))
                .isInstanceOf(OAuth2LinkExpiredException.class);
        verify(linkedIdentityRepository, never()).save(any());
    }

    @Test
    void confirmLink_failsWhenAccountNoLongerExists() {
        UUID ghostId = UUID.randomUUID();
        when(userRepository.findById(ghostId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.confirmLink(
                new PendingOAuth2Link(ghostId, AuthProvider.GOOGLE, "google-sub-1"), "x"))
                .isInstanceOf(OAuth2LinkExpiredException.class);
    }
}
