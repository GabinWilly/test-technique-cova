package com.cova.taskmanager.auth;

import com.cova.taskmanager.auth.dto.AuthResponse;
import com.cova.taskmanager.auth.dto.LoginRequest;
import com.cova.taskmanager.auth.dto.RegisterRequest;
import com.cova.taskmanager.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Profil de l'utilisateur connecte : permet au client de valider son jeton. */
    @GetMapping("/me")
    public AuthResponse.UserSummary me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.currentUser(principal.id());
    }
}
