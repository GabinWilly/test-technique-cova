package com.cova.taskmanager.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Les messages sont des <b>cles</b> entre accolades : Bean Validation est branche
 * sur le MessageSource, elles sont donc traduites selon Accept-Language.
 */
public record RegisterRequest(
        @NotBlank(message = "{auth.name.required}") @Size(max = 120) String name,
        @NotBlank(message = "{auth.email.required}")
                @Email(message = "{auth.email.invalid}")
                @Size(max = 180)
                String email,
        @NotBlank(message = "{auth.password.required}")
                @Size(min = 8, message = "{auth.password.tooShort}")
                String password) {}
