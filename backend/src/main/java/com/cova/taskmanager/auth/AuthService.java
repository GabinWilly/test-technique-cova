package com.cova.taskmanager.auth;

import com.cova.taskmanager.auth.dto.AuthResponse;
import com.cova.taskmanager.auth.dto.LoginRequest;
import com.cova.taskmanager.auth.dto.RegisterRequest;
import com.cova.taskmanager.domain.User;
import com.cova.taskmanager.repository.UserRepository;
import com.cova.taskmanager.security.JwtService;
import com.cova.taskmanager.web.ApiException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("auth.email.alreadyUsed");
        }

        User user = userRepository.save(User.builder()
                .name(request.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build());

        return buildResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Leve BadCredentialsException si l'email est inconnu ou le mot de passe faux ;
        // GlobalExceptionHandler la traduit en un message volontairement indistinct.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim(), request.password()));

        User user = userRepository
                .findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> ApiException.unauthorized("auth.credentials.invalid"));

        return buildResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserSummary currentUser(Long userId) {
        return userRepository
                .findById(userId)
                .map(u -> new AuthResponse.UserSummary(u.getId(), u.getName(), u.getEmail()))
                .orElseThrow(() -> ApiException.unauthorized("auth.token.invalid"));
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(
                token,
                jwtService.getValiditySeconds(),
                new AuthResponse.UserSummary(user.getId(), user.getName(), user.getEmail()));
    }
}
