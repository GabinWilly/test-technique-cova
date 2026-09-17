package com.cova.taskmanager.auth.dto;

/**
 * Reponse d'inscription et de connexion.
 *
 * @param token jeton JWT a placer dans l'en-tete Authorization
 * @param expiresIn duree de validite en secondes
 */
public record AuthResponse(String token, long expiresIn, UserSummary user) {

    public record UserSummary(Long id, String name, String email) {}
}
