package com.cova.taskmanager.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "{auth.email.required}") String email,
        @NotBlank(message = "{auth.password.required}") String password) {}
