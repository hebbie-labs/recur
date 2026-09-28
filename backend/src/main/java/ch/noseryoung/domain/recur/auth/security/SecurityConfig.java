package ch.noseryoung.domain.recur.auth.security;

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
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import ch.noseryoung.domain.recur.shared.exceptions.ErrorResponse;
import ch.noseryoung.domain.recur.auth.security.CustomUserDetailsService;
import ch.noseryoung.domain.recur.auth.security.jwt.JwtAuthenticationFilter;
import ch.noseryoung.domain.recur.auth.security.oauth2.CustomOAuth2UserService;
import ch.noseryoung.domain.recur.auth.security.oauth2.CustomOidcUserService;
import ch.noseryoung.domain.recur.auth.security.oauth2.OAuth2AuthenticationFailureHandler;
import ch.noseryoung.domain.recur.auth.security.oauth2.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        // Endpunkte, die weder Authentifizierung noch CSRF-Schutz brauchen: sie
        // liegen entweder vor jedem Cookie (login/register) oder sind selbst
        // Cookie-Ausstellung/-Widerruf ohne bereits authentifizierten Zustand,
        // der zu schützen wäre (#160).
        private static final String[] PUBLIC_PATHS = {
                        "/api/auth/register",
                        "/api/auth/login",
                        "/api/auth/oauth2/token",
                        "/api/auth/refresh",
                        "/api/auth/logout",
                        "/api/auth/verify-email",
                        "/api/auth/resend-verification",
                        "/api/auth/forgot-password",
                        "/api/auth/reset-password",
                        "/oauth2/**",
                        "/login/**",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/error/**"
        };

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
                                // Access-Token liegt jetzt in einem HttpOnly-Cookie statt im
                                // Authorization-Header (#160), das der Browser automatisch auf
                                // jeden Request mitschickt - macht die API CSRF-anfällig ohne
                                // eigenen Schutz. CookieCsrfTokenRepository statt der
                                // session-basierten Default-Variante, da die App komplett
                                // stateless ist (siehe sessionManagement unten). Handler ohne
                                // XOR-Maskierung, weil das Frontend den rohen Cookie-Wert per JS
                                // liest und ungemaskt im X-XSRF-TOKEN-Header zurückschickt (Axios
                                // macht das automatisch, siehe api.ts).
                                .csrf(csrf -> csrf
                                                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                                                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                                                .ignoringRequestMatchers(PUBLIC_PATHS)
                                                // Ohne das wired CsrfConfigurer intern eine
                                                // CsrfAuthenticationStrategy in
                                                // SessionManagementConfigurer ein, die "beim
                                                // Einloggen" das CSRF-Cookie killt und neu
                                                // ausstellen lässt (Schutz gegen Session-
                                                // Fixation). SessionManagementFilter hält aber bei
                                                // uns (STATELESS, kein HttpSession-Backing)
                                                // JEDEN Request mit gültigem JWT für eine frische
                                                // Authentifizierung - die Strategie feuert also bei
                                                // jedem einzelnen authentifizierten Request statt
                                                // nur beim echten Login, killt das Cookie also
                                                // dauerhaft. Das - nicht das Frontend - war die
                                                // Ursache des 403-Loops beim Abhaken/Task-Erstellen
                                                // (Cookie da -> gelöscht -> nächster Request ohne
                                                // Cookie -> 403), siehe #176/#177/#179. Kein
                                                // Schutz-Verlust: Double-Submit prüft nur
                                                // "Cookie == Header desselben Requests", nicht
                                                // Token-Frische. Wichtig: das muss hier auf dem
                                                // CsrfConfigurer selbst gesetzt werden, nicht via
                                                // .sessionManagement(...).sessionAuthenticationStrategy(...)
                                                // - letzteres landet nur zusätzlich in derselben
                                                // Composite-Liste statt die CsrfAuthenticationStrategy
                                                // zu ersetzen.
                                                .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(PUBLIC_PATHS)
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
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                                // CsrfFilter lädt den Token nur lazy (Supplier) - ohne diesen
                                // Filter würde das XSRF-TOKEN-Cookie nie tatsächlich geschrieben,
                                // weil ihn nie jemand liest. Offizielles Spring-Security-Rezept
                                // für SPA + Cookie-basiertes CSRF.
                                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class);

                return http.build();
        }

        private static final class CsrfCookieFilter extends OncePerRequestFilter {
                @Override
                protected void doFilterInternal(
                                HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws IOException, ServletException {
                        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
                        if (csrfToken != null) {
                                csrfToken.getToken();
                        }
                        filterChain.doFilter(request, response);
                }
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