package com.cova.taskmanager.auth;

import com.cova.taskmanager.repository.UserRepository;
import com.cova.taskmanager.security.AuthenticatedUser;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Charge un utilisateur par son e-mail pour l'authentification par mot de passe. */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return userRepository
                .findByEmailIgnoreCase(email)
                .map(AuthenticatedUser::from)
                .orElseThrow(() -> new UsernameNotFoundException(email));
    }
}
