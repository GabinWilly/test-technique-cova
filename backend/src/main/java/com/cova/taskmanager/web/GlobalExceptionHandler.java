package com.cova.taskmanager.web;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduit toutes les erreurs en une reponse {@link ApiError} coherente.
 *
 * <p>La locale vient de l'en-tete Accept-Language, resolue par Spring avant
 * d'arriver ici.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException ex, Locale locale) {
        String message = messageSource.getMessage(ex.getMessageKey(), ex.getArgs(), locale);
        return ResponseEntity.status(ex.getStatus())
                .body(ApiError.of(ex.getStatus().value(), message));
    }

    /** Echec d'authentification : on ne precise jamais si c'est l'email ou le mot de passe. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(Locale locale) {
        String message = messageSource.getMessage("auth.credentials.invalid", null, locale);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of(HttpStatus.UNAUTHORIZED.value(), message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex, Locale locale) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            // le message est deja resolu par le MessageSource (voir InternationalizationConfig)
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        String message = messageSource.getMessage("error.validation", null, locale);
        return ResponseEntity.badRequest()
                .body(ApiError.of(HttpStatus.BAD_REQUEST.value(), message, fieldErrors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, Locale locale) {
        // trace complete cote serveur, message generique cote client
        log.error("Erreur non geree", ex);
        String message = messageSource.getMessage("error.internal", null, locale);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), message));
    }
}
