package ch.noseryoung.domain.recur.group.event;

import java.util.List;
import java.util.UUID;

// Published by ProjectService#deleteProject and GroupService#deleteGroupInternal
// before the projects themselves are deleted, so TaskService can delete the
// projects' tasks first - group must not call task's repository directly.
public record ProjectsDeletedEvent(List<UUID> projectIds) {
}
