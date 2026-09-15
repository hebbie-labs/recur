package ch.noseryoung.domain.recur.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import ch.noseryoung.domain.recur.exceptions.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Value("${app.cors.allowed-origin}")
        private String allowedOrigins;

        private final CustomUserDetailsService userDetailsService;
        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final CustomOidcUserService customOidcUserService;
        private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
        private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

        public SecurityConfig(
                        CustomUserDetailsService userDetailsService,
                        JwtAuthenticationFilter jwtAuthenticationFilter,
                        CustomOAuth2UserService customOAuth2UserService,
                        CustomOidcUserService customOidcUserService,
                        OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
                        OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler) {
                this.userDetailsService = userDetailsService;
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.customOAuth2UserService = customOAuth2UserService;
                this.customOidcUserService = customOidcUserService;
                this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
                this.oAuth2AuthenticationFailureHandler = oAuth2AuthenticationFailureHandler;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/api/auth/register",
                                                                "/api/auth/login",
                                                                "/oauth2/**",
                                                                "/login/**",
                                                                "/swagger-ui/**",
                                                                "/v3/api-docs/**",
                                                                "/error/**")
                                                .permitAll()
                                                // /api/auth/me (GET/PATCH/DELETE) intentionally NOT
                                                // permitAll - the "/api/auth/**" wildcard used to
                                                // cover it too, so anonymous requests reached
                                                // AuthService instead of being rejected here, only
                                                // failing because "anonymousUser" isn't a real email.
                                                .anyRequest().authenticated())
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint(
                                                                (request, response, authException) -> writeJsonError(
                                                                                response,
                                                                                HttpStatus.UNAUTHORIZED, "Unauthorized",
                                                                                "Authentifizierung erforderlich",
                                                                                request.getRequestURI()))
                                                .accessDeniedHandler((request, response,
                                                                accessDeniedException) -> writeJsonError(
                                                                                response,
                                                                                HttpStatus.FORBIDDEN, "Forbidden",
                                                                                "Keine Berechtigung für diese Ressource",
                                                                                request.getRequestURI())))
                                .oauth2Login(oauth2 -> oauth2
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService)
                                                                .oidcUserService(customOidcUserService))
                                                .successHandler(oAuth2AuthenticationSuccessHandler)
                                                .failureHandler(oAuth2AuthenticationFailureHandler))
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        private void writeJsonError(
                        HttpServletResponse response,
                        HttpStatus status,
                        String error,
                        String message,
                        String path) throws IOException {

                response.setStatus(status.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper()
                                .writeValueAsString(ErrorResponse.of(status.value(), error, message, path)));
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                                .map(String::trim)
                                .toList());
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder);
                return authProvider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }
}