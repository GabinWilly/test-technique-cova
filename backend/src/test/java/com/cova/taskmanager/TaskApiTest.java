package com.cova.taskmanager;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TaskApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String tokenProprietaire;
    private String tokenAutre;

    @BeforeEach
    void creerDeuxUtilisateurs() throws Exception {
        tokenProprietaire = inscrire("proprietaire@example.com");
        tokenAutre = inscrire("autre@example.com");
    }

    private String inscrire(String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test","email":"%s","password":"motdepasse123"}
                                """
                                .formatted(email)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(body).get("token").asString();
    }

    private long creerTache(String token, String titre, String description, String statut)
            throws Exception {
        String body = mockMvc.perform(post("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"%s","description":"%s","status":"%s"}
                                """
                                .formatted(titre, description, statut)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void creeUneTacheAvecLeStatutTodoParDefaut() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Sans statut"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("TODO"));
    }

    @Test
    void refuseUneTacheSansTitre() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire)
                        .header(HttpHeaders.ACCEPT_LANGUAGE, "en")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").value("Task title is required."));
    }

    @Test
    void filtreParStatut() throws Exception {
        creerTache(tokenProprietaire, "A faire", "x", "TODO");
        creerTache(tokenProprietaire, "En cours", "y", "IN_PROGRESS");

        mockMvc.perform(get("/api/tasks")
                        .param("status", "IN_PROGRESS")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("En cours"));
    }

    @Test
    void chercheDansLeTitreEtLaDescriptionSansTenirCompteDeLaCasse() throws Exception {
        creerTache(tokenProprietaire, "Preparer la demo", "slides", "TODO");
        creerTache(tokenProprietaire, "Autre sujet", "contient DEMO ici", "TODO");
        creerTache(tokenProprietaire, "Rien a voir", "neant", "TODO");

        mockMvc.perform(get("/api/tasks")
                        .param("search", "dEmO")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void modifieUneTacheEtAvanceUpdatedAt() throws Exception {
        long id = creerTache(tokenProprietaire, "Titre initial", "desc", "TODO");

        String body = mockMvc.perform(put("/api/tasks/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Titre modifie","description":"desc","status":"DONE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Titre modifie"))
                .andExpect(jsonPath("$.status").value("DONE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // updatedAt est pose par un @PreUpdate : sans flush avant la reponse, on
        // renverrait encore l'ancienne valeur.
        JsonNode json = objectMapper.readTree(body);
        String createdAt = json.get("createdAt").asString();
        String updatedAt = json.get("updatedAt").asString();
        org.assertj.core.api.Assertions.assertThat(updatedAt).isNotEqualTo(createdAt);
    }

    @Test
    void supprimeUneTache() throws Exception {
        long id = creerTache(tokenProprietaire, "A supprimer", "desc", "TODO");

        mockMvc.perform(delete("/api/tasks/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void neListeQueLesTachesDeLUtilisateurConnecte() throws Exception {
        creerTache(tokenProprietaire, "Privee", "desc", "TODO");

        mockMvc.perform(get("/api/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAutre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void repondEnNotFoundQuandUnAutreUtilisateurCibleLaTache() throws Exception {
        long id = creerTache(tokenProprietaire, "Privee", "desc", "TODO");

        // 404 et non 403 : un 403 confirmerait l'existence de l'identifiant et
        // permettrait d'enumerer les taches des autres comptes.
        mockMvc.perform(put("/api/tasks/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAutre)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"pirate"}
                                """))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/tasks/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAutre))
                .andExpect(status().isNotFound());

        // la tache est restee intacte pour son proprietaire
        mockMvc.perform(get("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProprietaire))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Privee"));
    }
}
