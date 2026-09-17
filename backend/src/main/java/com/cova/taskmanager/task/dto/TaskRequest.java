package com.cova.taskmanager.task.dto;

import com.cova.taskmanager.domain.Task;
import com.cova.taskmanager.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corps de creation et de modification d'une tache.
 *
 * @param status optionnel a la creation : vaut TODO par defaut
 */
public record TaskRequest(
        @NotBlank(message = "{task.title.required}")
                @Size(max = Task.TITLE_MAX_LENGTH, message = "{task.title.tooLong}")
                String title,
        @Size(max = Task.DESCRIPTION_MAX_LENGTH, message = "{task.description.tooLong}")
                String description,
        TaskStatus status) {}
