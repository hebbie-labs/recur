package ch.noseryoung.domain.recur.user.event;

import java.util.UUID;

// Published by UserService#deleteCurrentUser before the User row itself is
// deleted, so listeners in other domains (auth: tokens/sessions,
// notification: settings, task: createdBy/hiddenFor) can clean up their own
// FK references first. See #230 for known gaps in what gets cleaned up.
public record UserDeletedEvent(UUID userId) {
}
