package ch.noseryoung.domain.recur.controllers;

import ch.noseryoung.domain.recur.dto.CreateTaskRequest;
import ch.noseryoung.domain.recur.dto.PatchTaskRequest;
import ch.noseryoung.domain.recur.models.Task;
import ch.noseryoung.domain.recur.services.TaskService;

import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/task")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
@Validated
public class TaskController {

        private final TaskService taskService;

        public TaskController(TaskService taskService) {
                this.taskService = taskService;
        }

        @GetMapping({ "", "/" })
        public ResponseEntity<Collection<Task>> getTasks(@RequestParam(required = false) Boolean archived,
                        @RequestParam(required = false) Boolean favorite) {
                return taskService.getTasks(archived, favorite);
        };

        @GetMapping({ "/{id}", "/{id}/" })
        public ResponseEntity<Task> getTask(@PathVariable UUID id) {
                return taskService.getTask(id);
        };

        @PostMapping({ "", "/" })
        public ResponseEntity<Task> createTask(@Valid @RequestBody CreateTaskRequest request) {
                return taskService.createTask(request);
        };

        // Alle Felder auf PatchTaskRequest sind optional (null = nicht ändern),
        // deshalb reicht hier @Valid ohne eigene Validation-Group.
        @PatchMapping({ "/{id}", "/{id}/" })
        public ResponseEntity<Task> patchTask(@PathVariable UUID id, @Valid @RequestBody PatchTaskRequest request,
                        @RequestParam(required = false) Boolean resetProgress,
                        @RequestParam(required = false) Boolean favorite,
                        @RequestParam(required = false) Boolean archived,
                        @RequestParam(required = false) @Min(0) @Max(1_000_000) Integer amountDid,
                        @RequestParam(required = false) Boolean unassignProject) {
                return taskService.patchTask(id, request, resetProgress, favorite, archived, amountDid, unassignProject);
        }

        @PostMapping({ "/{id}/assign", "/{id}/assign/" })
        public ResponseEntity<Task> assignSelf(@PathVariable UUID id) {
                return taskService.assignSelf(id);
        }

        @PostMapping({ "/{id}/unassign", "/{id}/unassign/" })
        public ResponseEntity<Task> unassignSelf(@PathVariable UUID id) {
                return taskService.unassignSelf(id);
        }

        @DeleteMapping({ "/{id}", "/{id}/" })
        public ResponseEntity<Task> deleteTask(@PathVariable UUID id) {
                return taskService.deleteTask(id);
        }

        @DeleteMapping({ "", "/" })
        public ResponseEntity<Task> deleteAllTasks() {
                return taskService.deleteAllTasks();
        }
}