package com.cova.taskmanager.config;

import java.util.List;
import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/**
 * Internationalisation de l'API.
 *
 * <p>La langue est deduite de l'en-tete HTTP {@code Accept-Language} envoye par
 * le client (le frontend React et l'app Flutter le positionnent tous les deux).
 * L'API reste sans etat : aucune langue n'est stockee en session.
 */
@Configuration
public class InternationalizationConfig {

    /** Langues reellement traduites ; toute autre demande retombe sur le francais. */
    public static final List<Locale> SUPPORTED_LOCALES = List.of(Locale.FRENCH, Locale.ENGLISH);

    public static final Locale DEFAULT_LOCALE = Locale.FRENCH;

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(SUPPORTED_LOCALES);
        resolver.setDefaultLocale(DEFAULT_LOCALE);
        return resolver;
    }

    /**
     * Branche Bean Validation sur le MessageSource de l'application, pour que
     * {@code @NotBlank(message = "{task.title.required}")} soit resolu dans les
     * fichiers messages_*.properties plutot que dans ValidationMessages.properties.
     */
    @Bean
    public LocalValidatorFactoryBean getValidator(MessageSource messageSource) {
        LocalValidatorFactoryBean factory = new LocalValidatorFactoryBean();
        factory.setValidationMessageSource(messageSource);
        return factory;
    }
}
