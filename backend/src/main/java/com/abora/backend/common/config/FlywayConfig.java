package com.abora.backend.common.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                // Automatically repair Flyway schema history to fix checksum mismatches and failed migrations
                flyway.repair();
            } catch (Exception e) {
                // Ignore any repair warning
            }
            flyway.migrate();
        };
    }
}
