package com.cova.taskmanager;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthApiTest {

    @Autowired private MockMvc mockMvc;

    private static String registerBody(String email) {
        return """
                {"name":"Wilson","email":"%s","password":"motdepasse123"}
                """
                .formatted(email);
    }

    @Test
    void inscritUnUtilisateurEtRenvoieUnJeton() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("nouveau@example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email").value("nouveau@example.com"));
    }

    @Test
    void refuseUneAdresseDejaUtilisee() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("doublon@example.com")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("doublon@example.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("déjà utilisée")));
    }

    @Test
    void traduitLeMessageDErreurSelonAcceptLanguage() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("i18n@example.com")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("i18n@example.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This email address is already in use."));
    }

    @Test
    void renvoieLesErreursDeValidationParChamp() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","email":"pas-un-email","password":"123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required."))
                .andExpect(jsonPath("$.fieldErrors.email").value("Email address is invalid."))
                .andExpect(jsonPath("$.fieldErrors.password")
                        .value("Password must be at least 8 characters long."));
    }

    @Test
    void refuseUnMotDePasseIncorrect() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("login@example.com")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"login@example.com","password":"mauvais"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refuseLAccesSansJeton() throws Exception {
        mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void refuseUnJetonInvalide() throws Exception {
        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer nimportequoi"))
                .andExpect(status().isUnauthorized());
    }
}
