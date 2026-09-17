package com.cova.taskmanager.task;

import java.util.List;

import com.cova.taskmanager.domain.TaskStatus;
import com.cova.taskmanager.security.AuthenticatedUser;
import com.cova.taskmanager.task.dto.TaskRequest;
import com.cova.taskmanager.task.dto.TaskResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * @param status filtre optionnel sur le statut
     * @param search recherche optionnelle dans le titre et la description
     */
    @GetMapping
    public List<TaskResponse> list(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) String search) {
        return taskService.list(principal.id(), status, search);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(principal.id(), request));
    }

    @PutMapping("/{id}")
    public TaskResponse update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request) {
        return taskService.update(principal.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser principal, @PathVariable Long id) {
        taskService.delete(principal.id(), id);
        return ResponseEntity.noContent().build();
    }
}
