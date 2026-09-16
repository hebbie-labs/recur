package ch.noseryoung.domain.recur.controllers;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ch.noseryoung.domain.recur.dto.CreateGroupRequest;
import ch.noseryoung.domain.recur.dto.GroupInvitePreview;
import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.models.TaskGroup;
import ch.noseryoung.domain.recur.services.GroupService;

@RestController
@RequestMapping("/api/group")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping({ "", "/" })
    public ResponseEntity<TaskGroup> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        return groupService.createGroup(request);
    }

    @GetMapping({ "", "/" })
    public ResponseEntity<Collection<TaskGroup>> getMyGroups() {
        return groupService.getMyGroups();
    }

    @GetMapping({ "/{id}", "/{id}/" })
    public ResponseEntity<TaskGroup> getGroup(@PathVariable UUID id) {
        return groupService.getGroup(id);
    }

    // Projekte aller eigenen Gruppen in einem Request statt einem Request pro
    // Gruppe - siehe GroupService#getProjectsForMyGroups.
    @GetMapping({ "/projects", "/projects/" })
    public ResponseEntity<Map<UUID, List<Project>>> getProjectsForMyGroups() {
        return groupService.getProjectsForMyGroups();
    }

    @DeleteMapping({ "/{id}", "/{id}/" })
    public ResponseEntity<Void> deleteGroup(@PathVariable UUID id) {
        return groupService.deleteGroup(id);
    }

    @PostMapping({ "/{id}/leave", "/{id}/leave/" })
    public ResponseEntity<Void> leaveGroup(@PathVariable UUID id,
            @RequestParam(required = false) UUID successorId) {
        return groupService.leaveGroup(id, successorId);
    }

    @DeleteMapping({ "/{id}/members/{memberId}", "/{id}/members/{memberId}/" })
    public ResponseEntity<Void> removeMember(@PathVariable UUID id, @PathVariable UUID memberId) {
        return groupService.removeMember(id, memberId);
    }

    @PatchMapping({ "/{id}/admin", "/{id}/admin/" })
    public ResponseEntity<TaskGroup> transferAdmin(@PathVariable UUID id, @RequestParam UUID newAdminId) {
        return groupService.transferAdmin(id, newAdminId);
    }

    // Vorschau vor dem eigentlichen Beitritt (kein Auto-Join), damit ein
    // vorab abgerufener Link (z.B. Chat-Link-Preview) niemanden versehentlich
    // in die Gruppe holt.
    @GetMapping({ "/invite/{inviteCode}", "/invite/{inviteCode}/" })
    public ResponseEntity<GroupInvitePreview> previewInvite(@PathVariable String inviteCode) {
        return groupService.previewInvite(inviteCode);
    }

    @PostMapping({ "/invite/{inviteCode}/join", "/invite/{inviteCode}/join/" })
    public ResponseEntity<TaskGroup> joinGroup(@PathVariable String inviteCode) {
        return groupService.joinGroup(inviteCode);
    }
}
