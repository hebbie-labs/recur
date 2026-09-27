package ch.noseryoung.domain;

import org.springframework.boot.SpringApplication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling für TaskReminderScheduler (#102).
@SpringBootApplication
@RestController
@EnableScheduling
public class RecurApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecurApplication.class, args);
    }
}