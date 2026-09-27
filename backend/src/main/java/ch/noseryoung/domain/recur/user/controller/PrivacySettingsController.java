package ch.noseryoung.domain.recur.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.noseryoung.domain.recur.user.dto.PrivacySettingsResponse;
import ch.noseryoung.domain.recur.user.service.PrivacySettingsService;

@RestController
@RequestMapping("/api/auth/me/privacy-settings")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class PrivacySettingsController {

    private final PrivacySettingsService privacySettingsService;

    public PrivacySettingsController(PrivacySettingsService privacySettingsService) {
        this.privacySettingsService = privacySettingsService;
    }

    @GetMapping
    public ResponseEntity<PrivacySettingsResponse> getCurrentSettings() {
        return ResponseEntity.ok(privacySettingsService.getCurrentSettings());
    }

    // Bewusst kein @Valid: null-Felder bedeuten "nicht ändern" (siehe PrivacySettingsResponse).
    @PatchMapping
    public ResponseEntity<PrivacySettingsResponse> updateCurrentSettings(
            @RequestBody PrivacySettingsResponse update) {
        return ResponseEntity.ok(privacySettingsService.updateCurrentSettings(update));
    }
}
