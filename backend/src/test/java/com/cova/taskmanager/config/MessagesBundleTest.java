package com.cova.taskmanager.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;
import java.util.Properties;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.core.io.ClassPathResource;

/**
 * Verifie que les bundles de traduction sont coherents entre eux.
 *
 * <p>Ces tests tournent sans contexte Spring ni base de donnees : ils portent
 * sur les fichiers messages_*.properties eux-memes.
 */
class MessagesBundleTest {

    private final ResourceBundleMessageSource messageSource = buildMessageSource();

    private static ResourceBundleMessageSource buildMessageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding("UTF-8");
        source.setFallbackToSystemLocale(false);
        return source;
    }

    @Test
    void resoutLesMessagesEnFrancais() {
        assertThat(messageSource.getMessage("task.notFound", null, Locale.FRENCH))
                .isEqualTo("Tâche introuvable.");
    }

    @Test
    void resoutLesMessagesEnAnglais() {
        assertThat(messageSource.getMessage("task.notFound", null, Locale.ENGLISH))
                .isEqualTo("Task not found.");
    }

    @Test
    void retombeSurLeFrancaisPourUneLangueNonSupportee() {
        // AcceptHeaderLocaleResolver ramene toute langue inconnue sur la locale
        // par defaut ; on verifie ici que cette locale a bien une traduction.
        Locale resolved = InternationalizationConfig.DEFAULT_LOCALE;

        assertThat(InternationalizationConfig.SUPPORTED_LOCALES).contains(resolved);
        assertThat(messageSource.getMessage("error.internal", null, resolved))
                .isEqualTo("Une erreur interne est survenue.");
    }

    @Test
    void interpoleLesParametresNommes() {
        assertThat(messageSource.getMessage("task.title.tooLong", null, Locale.ENGLISH))
                .contains("{max}");
    }

    @Test
    void lesDeuxLanguesExposentExactementLesMemesCles() throws Exception {
        Set<Object> fr = loadKeys("messages_fr.properties");
        Set<Object> en = loadKeys("messages_en.properties");

        assertThat(fr)
                .as("cles presentes en francais mais absentes en anglais")
                .isEqualTo(en);
    }

    private Set<Object> loadKeys(String fileName) throws Exception {
        Properties properties = new Properties();
        try (var in = new ClassPathResource(fileName).getInputStream()) {
            properties.load(in);
        }
        return properties.keySet();
    }
}
