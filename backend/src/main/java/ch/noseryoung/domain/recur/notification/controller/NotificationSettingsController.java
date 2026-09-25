package ch.noseryoung.domain.recur.notification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.noseryoung.domain.recur.notification.dto.NotificationSettingsResponse;
import ch.noseryoung.domain.recur.notification.service.NotificationSettingsService;

@RestController
@RequestMapping("/api/auth/me/notification-settings")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class NotificationSettingsController {

    private final NotificationSettingsService notificationSettingsService;

    public NotificationSettingsController(NotificationSettingsService notificationSettingsService) {
        this.notificationSettingsService = notificationSettingsService;
    }

    @GetMapping
    public ResponseEntity<NotificationSettingsResponse> getCurrentSettings() {
        return ResponseEntity.ok(notificationSettingsService.getCurrentSettings());
    }

    // Bewusst kein @Valid: null-Felder bedeuten "nicht ändern" (siehe NotificationSettingsResponse).
    @PatchMapping
    public ResponseEntity<NotificationSettingsResponse> updateCurrentSettings(
            @RequestBody NotificationSettingsResponse update) {
        return ResponseEntity.ok(notificationSettingsService.updateCurrentSettings(update));
    }
}
