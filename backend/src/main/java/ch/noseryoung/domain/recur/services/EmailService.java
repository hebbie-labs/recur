package ch.noseryoung.domain.recur.services;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.models.User;

@Service
public class EmailService {

    private static final Logger logger = LogManager.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Ein Ausfall des Mail-Relays darf die Registrierung nicht mit einem 500
    // scheitern lassen - der User-Datensatz ist zu diesem Zeitpunkt bereits
    // gespeichert, ein erneuter Versuch würde nur auf EmailAlreadyExistsException
    // laufen. Der Nutzer kann die E-Mail stattdessen über "erneut senden"
    // anfordern. Der Link wird zusätzlich auf DEBUG geloggt, damit die
    // Verifizierung auch lokal ohne SMTP-Zugangsdaten testbar ist.
    public void sendVerificationEmail(User user, String verificationLink) {
        logger.debug("Verification link for {}: {}", user.getEmail(), verificationLink);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject("Bestätige deine E-Mail-Adresse bei Recur");
        message.setText(
                "Hallo " + user.getFirstName() + ",\n\n"
                        + "bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:\n\n"
                        + verificationLink + "\n\n"
                        + "Dieser Link ist 24 Stunden gültig.\n\n"
                        + "Falls du dich nicht bei Recur registriert hast, kannst du diese E-Mail ignorieren.");

        trySend(message);
    }

    public void sendWelcomeEmail(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject("Willkommen bei Recur");
        message.setText(
                "Hallo " + user.getFirstName() + ",\n\n"
                        + "willkommen bei Recur! Dein Konto wurde erfolgreich über Google erstellt.");

        trySend(message);
    }

    private void trySend(SimpleMailMessage message) {
        try {
            mailSender.send(message);
        } catch (MailException e) {
            logger.error("Failed to send email to {}", message.getTo(), e);
        }
    }
}
