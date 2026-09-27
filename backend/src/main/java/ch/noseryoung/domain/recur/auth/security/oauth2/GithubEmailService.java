package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.List;
import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubEmailService {

        private final RestClient restClient = RestClient.builder()
                        .baseUrl("https://api.github.com")
                        .build();

        public String getPrimaryEmail(String accessToken) {

                List<Map<String, Object>> emails = restClient.get()
                                .uri("/user/emails")
                                .header(
                                                HttpHeaders.AUTHORIZATION,
                                                "Bearer " + accessToken)
                                .accept(MediaType.APPLICATION_JSON)
                                .retrieve()
                                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                                });

                if (emails == null) {
                        return null;
                }

                for (Map<String, Object> email : emails) {

                        Boolean primary = (Boolean) email.get("primary");
                        Boolean verified = (Boolean) email.get("verified");

                        if (Boolean.TRUE.equals(primary)
                                        && Boolean.TRUE.equals(verified)) {

                                return (String) email.get("email");
                        }
                }

                return null;
        }

        public boolean isPrimaryEmailVerified(String accessToken) {

                List<Map<String, Object>> emails = restClient.get()
                                .uri("/user/emails")
                                .header(
                                                HttpHeaders.AUTHORIZATION,
                                                "Bearer " + accessToken)
                                .accept(MediaType.APPLICATION_JSON)
                                .retrieve()
                                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                                });

                if (emails == null) {
                        return false;
                }

                for (Map<String, Object> email : emails) {

                        Boolean primary = (Boolean) email.get("primary");
                        Boolean verified = (Boolean) email.get("verified");

                        if (Boolean.TRUE.equals(primary)) {
                                return Boolean.TRUE.equals(verified);
                        }
                }

                return false;
        }
}