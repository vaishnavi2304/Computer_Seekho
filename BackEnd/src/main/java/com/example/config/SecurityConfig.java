package com.example.config;

import com.example.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                    // ---- Public: website content (Album/Announcement/
                    // Contact/Image controllers - no /api prefix) ----
                    .requestMatchers(HttpMethod.GET, "/albums", "/albums/*").permitAll()
                    .requestMatchers(HttpMethod.GET, "/images").permitAll()
                    .requestMatchers(HttpMethod.GET, "/announcements").permitAll()
                    // submitting the Contact-Us form is public; viewing/
                    // deleting the submitted messages stays admin-only
                    .requestMatchers(HttpMethod.POST, "/contacts").permitAll()
                    
                    // ---- Public: course & batch browsing (Programs,
                    // ProgramDetail, Home, PayFees pages) ----
                    .requestMatchers(HttpMethod.GET,
                            "/api/courses/active",
                            "/api/courses/search",
                            "/api/courses/*"
                    ).permitAll()
                    .requestMatchers(HttpMethod.GET,
                            "/api/batches",
                            "/api/batches/course/*/active"
                    ).permitAll()
                    // ---- Public: recruiters & placements showcase ----
                    .requestMatchers(HttpMethod.GET, "/api/recruiters").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/placements").permitAll()

                    // ---- Public: student/faculty showcase (Home,
                    // Placements, Campus pages) ----
                    .requestMatchers(HttpMethod.GET, "/api/students").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/staff").permitAll()

                    // ---- Public: submitting an enquiry (Enquiry page) ----
                    .requestMatchers(HttpMethod.POST, "/api/enquiries").permitAll()

                    // ---- Public: online fee payment (PayFees page) ----
                    .requestMatchers(HttpMethod.POST,
                            "/api/payments/create-order",
                            "/api/payments/verify"
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
                    .permitAll()
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