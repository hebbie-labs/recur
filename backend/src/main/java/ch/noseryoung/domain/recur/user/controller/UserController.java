package ch.noseryoung.domain.recur.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.noseryoung.domain.recur.user.dto.SetPasswordRequest;
import ch.noseryoung.domain.recur.user.dto.UserResponse;
import ch.noseryoung.domain.recur.user.service.UserService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth/me")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PatchMapping
    public ResponseEntity<UserResponse> updateCurrentUser(@Valid @RequestBody UserResponse userResponse) {
        return ResponseEntity.ok(userService.updateCurrentUser(userResponse));
    }

    // Nur für Konten ohne Passwort (über Google/GitHub entstanden, #236) -
    // Passwort ändern ist ein eigener Flow mit altem Passwort.
    @PostMapping("/password")
    public ResponseEntity<UserResponse> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        return ResponseEntity.ok(userService.setPassword(request.password()));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteCurrentUser() {
        userService.deleteCurrentUser();
        return ResponseEntity.noContent().build();
    }
}
