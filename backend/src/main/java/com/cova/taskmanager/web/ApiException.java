package com.cova.taskmanager.web;

import org.springframework.http.HttpStatus;

/**
 * Erreur metier portant une <b>cle de message</b> plutot qu'un texte.
 *
 * <p>La traduction est faite au moment de la reponse, selon l'en-tete
 * Accept-Language de l'appelant : le service metier n'a pas a connaitre la langue.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String messageKey;
    private final transient Object[] args;

    public ApiException(HttpStatus status, String messageKey, Object... args) {
        super(messageKey);
        this.status = status;
        this.messageKey = messageKey;
        this.args = args;
    }

    public static ApiException notFound(String messageKey) {
        return new ApiException(HttpStatus.NOT_FOUND, messageKey);
    }

    public static ApiException conflict(String messageKey) {
        return new ApiException(HttpStatus.CONFLICT, messageKey);
    }

    public static ApiException unauthorized(String messageKey) {
        return new ApiException(HttpStatus.UNAUTHORIZED, messageKey);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public Object[] getArgs() {
        return args;
    }
}
