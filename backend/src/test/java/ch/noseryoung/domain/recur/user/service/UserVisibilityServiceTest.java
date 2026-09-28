package ch.noseryoung.domain.recur.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ch.noseryoung.domain.recur.user.enums.ProfileVisibility;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.model.UserPrivacySettings;
import ch.noseryoung.domain.recur.user.repository.UserPrivacySettingsRepository;

/**
 * Deckt die Datenschutzerklärung-Maskierung ab: ein Mitglied mit
 * profileVisibility=HIDDEN zeigt anderen nur Initialen und kein Profilbild,
 * sieht sich selbst aber immer unmaskiert.
 */
@ExtendWith(MockitoExtension.class)
class UserVisibilityServiceTest {

    @Mock
    private UserPrivacySettingsRepository privacySettingsRepository;

    private UserVisibilityService visibilityService;
    private User viewer;

    @BeforeEach
    void setUp() {
        visibilityService = new UserVisibilityService(privacySettingsRepository);
        viewer = User.builder().id(UUID.randomUUID()).firstName("Viewer").lastName("User").build();
    }

    private User hiddenUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .firstName("Hidden")
                .lastName("Member")
                .avatarUrl("https://example.com/avatar.png")
                .build();
    }

    @Test
    void maskIfHidden_returnsTargetUnmaskedWhenViewerIsTarget() {
        User result = visibilityService.maskIfHidden(viewer, viewer);

        assertThat(result).isEqualTo(viewer);
    }

    @Test
    void maskIfHidden_masksFirstAndLastNameAndDropsAvatarWhenHidden() {
        User target = hiddenUser();
        when(privacySettingsRepository.findByUserId(target.getId()))
                .thenReturn(Optional.of(UserPrivacySettings.builder()
                        .user(target)
                        .profileVisibility(ProfileVisibility.HIDDEN)
                        .build()));

        User result = visibilityService.maskIfHidden(target, viewer);

        assertThat(result.getFirstName()).isEqualTo("H.");
        assertThat(result.getLastName()).isEqualTo("M.");
        assertThat(result.getAvatarUrl()).isNull();
        assertThat(result.getId()).isEqualTo(target.getId());
    }

    @Test
    void maskIfHidden_leavesTargetUntouchedWhenNoSettingsRowExists() {
        User target = hiddenUser();
        when(privacySettingsRepository.findByUserId(target.getId())).thenReturn(Optional.empty());

        User result = visibilityService.maskIfHidden(target, viewer);

        assertThat(result).isEqualTo(target);
        assertThat(result.getFirstName()).isEqualTo("Hidden");
    }

    @Test
    void maskIfHidden_collectionMasksHiddenMembersButNeverTheViewer() {
        User hidden = hiddenUser();
        User visible = User.builder().id(UUID.randomUUID()).firstName("Visible").lastName("Member").build();
        when(privacySettingsRepository.findByUserIdIn(anyCollection()))
                .thenReturn(List.of(UserPrivacySettings.builder()
                        .user(hidden)
                        .profileVisibility(ProfileVisibility.HIDDEN)
                        .build()));

        Set<User> result = visibilityService.maskIfHidden(Set.of(viewer, hidden, visible), viewer);

        assertThat(result).extracting(User::getFirstName)
                .containsExactlyInAnyOrder("Viewer", "H.", "Visible");
    }
}
