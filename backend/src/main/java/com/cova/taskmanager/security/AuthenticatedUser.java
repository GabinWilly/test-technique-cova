package com.cova.taskmanager.security;

import java.util.Collection;
import java.util.List;

import com.cova.taskmanager.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Principal place dans le SecurityContext.
 *
 * <p>Porte l'identifiant de l'utilisateur, ce qui evite une requete en base a
 * chaque controleur pour retrouver le proprietaire des taches.
 */
public record AuthenticatedUser(Long id, String email, String passwordHash) implements UserDetails {

    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getPasswordHash());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
