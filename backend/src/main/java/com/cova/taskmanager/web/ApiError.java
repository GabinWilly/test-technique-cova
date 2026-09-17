package com.cova.taskmanager.web;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Corps d'erreur unique de l'API.
 *
 * @param status code HTTP
 * @param message message deja traduit selon l'en-tete Accept-Language
 * @param fieldErrors erreurs de validation champ par champ, absent si vide
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        int status, String message, Map<String, String> fieldErrors, Instant timestamp) {

    public static ApiError of(int status, String message) {
        return new ApiError(status, message, Map.of(), Instant.now());
    }

    public static ApiError of(int status, String message, Map<String, String> fieldErrors) {
        return new ApiError(status, message, fieldErrors, Instant.now());
    }
}
