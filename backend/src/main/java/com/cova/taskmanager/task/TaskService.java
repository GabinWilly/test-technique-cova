package com.cova.taskmanager.task;

import java.util.List;

import com.cova.taskmanager.domain.Task;
import com.cova.taskmanager.domain.TaskStatus;
import com.cova.taskmanager.domain.User;
import com.cova.taskmanager.repository.TaskRepository;
import com.cova.taskmanager.repository.UserRepository;
import com.cova.taskmanager.task.dto.TaskRequest;
import com.cova.taskmanager.task.dto.TaskResponse;
import com.cova.taskmanager.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(Long ownerId, TaskStatus status, String search) {
        // une chaine vide equivaut a pas de recherche
        String normalized = (search == null || search.isBlank()) ? null : search.trim();
        return taskRepository.search(ownerId, status, normalized).stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional
    public TaskResponse create(Long ownerId, TaskRequest request) {
        User owner = userRepository
                .findById(ownerId)
                .orElseThrow(() -> ApiException.unauthorized("auth.token.invalid"));

        Task task = Task.builder()
                .title(request.title().trim())
                .description(normalizeDescription(request.description()))
                .status(request.status() == null ? TaskStatus.TODO : request.status())
                .owner(owner)
                .build();

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long ownerId, Long taskId, TaskRequest request) {
        Task task = requireOwnedTask(ownerId, taskId);

        task.setTitle(request.title().trim());
        task.setDescription(normalizeDescription(request.description()));
        if (request.status() != null) {
            task.setStatus(request.status());
        }

        // saveAndFlush et non save : @LastModifiedDate est pose par un @PreUpdate,
        // qui ne se declenche qu'au flush. Sans cela on renverrait l'ancien
        // updatedAt, alors que la base, elle, aurait la bonne valeur.
        return TaskResponse.from(taskRepository.saveAndFlush(task));
    }

    @Transactional
    public void delete(Long ownerId, Long taskId) {
        taskRepository.delete(requireOwnedTask(ownerId, taskId));
    }

    /**
     * Charge une tache en verifiant qu'elle appartient a l'appelant.
     *
     * <p>Renvoie volontairement 404 et non 403 quand la tache appartient a
     * quelqu'un d'autre : repondre 403 confirmerait l'existence de l'identifiant
     * et permettrait d'enumerer les taches des autres utilisateurs.
     */
    private Task requireOwnedTask(Long ownerId, Long taskId) {
        return taskRepository
                .findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> ApiException.notFound("task.notFound"));
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }
}
