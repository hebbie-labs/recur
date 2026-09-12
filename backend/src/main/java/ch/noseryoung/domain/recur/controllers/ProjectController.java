package ch.noseryoung.domain.recur.controllers;

import java.util.Collection;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.services.ProjectService;

@RestController
@RequestMapping("/api/group/{groupId}/project")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping({ "", "/" })
    public ResponseEntity<Project> createProject(@PathVariable UUID groupId, @Valid @RequestBody Project project) {
        return projectService.createProject(groupId, project);
    }

    @GetMapping({ "", "/" })
    public ResponseEntity<Collection<Project>> getProjects(@PathVariable UUID groupId) {
        return projectService.getProjects(groupId);
    }

    @PatchMapping({ "/{id}", "/{id}/" })
    public ResponseEntity<Project> patchProject(@PathVariable UUID groupId, @PathVariable UUID id,
            @RequestParam(required = false) Boolean archived) {
        return projectService.patchProject(groupId, id, archived);
    }

    @DeleteMapping({ "/{id}", "/{id}/" })
    public ResponseEntity<Void> deleteProject(@PathVariable UUID groupId, @PathVariable UUID id) {
        return projectService.deleteProject(groupId, id);
    }
}
