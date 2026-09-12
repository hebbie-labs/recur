package ch.noseryoung.domain.recur.controllers;

import ch.noseryoung.domain.recur.models.Task;
import ch.noseryoung.domain.recur.services.TaskService;

import java.util.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/task")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
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

        // OnCreate-Gruppe statt @Valid, damit die Pflichtfeld-Constraints (name,
        // category, frequency, description, dateUntil) nur beim Erstellen greifen.
        @PostMapping({ "", "/" })
        public ResponseEntity<Task> createTask(@Validated(Task.OnCreate.class) @RequestBody Task task) {
                return taskService.createTask(task);
        };

        // Bewusst weiterhin @Valid (Default-Gruppe) statt OnCreate: patchTask()
        // erlaubt partielle Updates mit leeren Feldern, das würde mit den
        // OnCreate-Pflichtfeld-Constraints sonst fehlschlagen.
        @PatchMapping({ "/{id}", "/{id}/" })
        public ResponseEntity<Task> patchTask(@PathVariable UUID id, @Valid @RequestBody Task task,
                        @RequestParam(required = false) Boolean resetProgress,
                        @RequestParam(required = false) Boolean favorite,
                        @RequestParam(required = false) Boolean archived,
                        @RequestParam(required = false) Integer amountDid,
                        @RequestParam(required = false) Boolean unassignProject) {
                return taskService.patchTask(id, task, resetProgress, favorite, archived, amountDid, unassignProject);
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