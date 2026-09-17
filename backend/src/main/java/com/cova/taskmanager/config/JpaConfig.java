package com.cova.taskmanager.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** Active le renseignement automatique de createdAt / updatedAt. */
@Configuration
@EnableJpaAuditing
public class JpaConfig {}
