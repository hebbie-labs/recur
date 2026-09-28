package ch.noseryoung.domain.recur.shared.service;

import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class EmailService {

    private static final Logger logger = LogManager.getLogger(EmailService.class);

    private final RestClient restClient;

    @Value("${app.mail.from}")
    private String from;

    public EmailService(@Value("${app.mail.brevo-api-key}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3/smtp/email")
                .defaultHeader("api-key", apiKey)
                .defaultHeader("accept", "application/json")
                .build();
    }

    // Fire-and-forget: ein Ausfall des Brevo-API-Aufrufs darf den Aufrufer nie
    // mit einem 500 scheitern lassen (Registrierung, Task-Erstellung,
    // Scheduler-Durchlauf) - siehe die jeweiligen Aufrufer für den Kontext.
    public void send(String to, String subject, String text) {
        BrevoEmailRequest request = new BrevoEmailRequest(
                new BrevoEmailRequest.Sender(from),
                List.of(new BrevoEmailRequest.Recipient(to)),
                subject,
                text);

        try {
            restClient.post()
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            logger.error("Failed to send email to {}", to, e);
        }
    }

    private record BrevoEmailRequest(Sender sender, List<Recipient> to, String subject, String textContent) {
        private record Sender(String email) {
        }

        private record Recipient(String email) {
        }
    }
}
