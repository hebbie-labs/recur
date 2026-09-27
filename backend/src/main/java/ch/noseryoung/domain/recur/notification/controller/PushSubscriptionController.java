package ch.noseryoung.domain.recur.notification.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ch.noseryoung.domain.recur.notification.dto.PushSubscriptionRequest;
import ch.noseryoung.domain.recur.notification.service.PushSubscriptionService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/push")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class PushSubscriptionController {

    private final PushSubscriptionService pushSubscriptionService;

    public PushSubscriptionController(PushSubscriptionService pushSubscriptionService) {
        this.pushSubscriptionService = pushSubscriptionService;
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushSubscriptionService.getVapidPublicKey()));
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<Void> subscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        pushSubscriptionService.subscribe(request);
        return ResponseEntity.status(201).build();
    }

    @DeleteMapping("/subscriptions")
    public ResponseEntity<Void> unsubscribe(@RequestParam String endpoint) {
        pushSubscriptionService.unsubscribe(endpoint);
        return ResponseEntity.noContent().build();
    }
}
