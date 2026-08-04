package com.example.config;

import com.example.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http

            // Disable CSRF because we are using JWT
            .csrf(csrf -> csrf.disable())

            // Enable CORS
            .cors(cors -> {})

            // Disable Spring's default login page
            .formLogin(form -> form.disable())

            // Disable HTTP Basic Authentication
            .httpBasic(basic -> basic.disable())

            // Make the application stateless
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Authorization Rules
            .authorizeHttpRequests(auth -> auth

                    /*
                     * Public login endpoint
                     */
                    .requestMatchers(
                            "/api/auth/login",
                            "/api/auth/google"
                    ).permitAll()

                    /*
                     * Anyone can check basic application
                     * health and information.
                     */
                    .requestMatchers(
                            "/actuator/health",
                            "/actuator/health/**",
                            "/actuator/info"
                    ).permitAll()

                    /*
                     * Other actuator endpoints require JWT.
                     */
                    .requestMatchers(
                            "/actuator/**"
                    ).authenticated()

                    /*
                     * All remaining endpoints require JWT.
                     */
                    .anyRequest()
                    .authenticated()
            )

            // Register JWT Filter
            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

}