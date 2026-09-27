package ch.noseryoung.domain.recur;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

// Erzwingt den in CLAUDE.md dokumentierten Abhängigkeitsgraphen zwischen den
// Domains (#229) - keine Spring-/JPA-Abhängigkeit nötig, liest einfach die
// Imports aus jeder .java-Datei unter src/main/java. Reine Textanalyse, kein
// Bytecode-Tool wie ArchUnit, um keine neue Abhängigkeit für einen einzigen
// Test einzuführen.
class ArchitectureTest {

    private static final Path MAIN_JAVA = Path.of("src/main/java/ch/noseryoung/domain/recur");

    // Nur in diese Richtung erlaubt - die Gegenrichtung läuft über Spring
    // ApplicationEvents (siehe user/event, group/event, task/event).
    private static final Map<String, Set<String>> ALLOWED_DEPENDENCIES = Map.of(
            "shared", Set.of(),
            "user", Set.of("shared"),
            "auth", Set.of("user", "shared"),
            "group", Set.of("user", "shared"),
            "task", Set.of("user", "group", "shared"),
            "notification", Set.of("user", "group", "task", "shared"));

    // UserRepository ist die eine akzeptierte Ausnahme: User ist der
    // gemeinsame Identitäts-Kern, den jede erlaubte Richtung lesen darf, ohne
    // dass user dafür eine eigene Lookup-Service-Methode pro Aufrufer
    // bräuchte. Jede andere Domain-Repository-Nutzung muss über den Service
    // der jeweiligen Domain laufen (siehe GroupService#requireProjectForMember,
    // die Events in user/group/task/event).
    private static final Pattern REPOSITORY_IMPORT = Pattern
            .compile("^import ch\\.noseryoung\\.domain\\.recur\\.([a-z]+)\\.repository\\.(?!UserRepository;).*");

    private static final Pattern DOMAIN_IMPORT = Pattern
            .compile("^import ch\\.noseryoung\\.domain\\.recur\\.([a-z]+)\\.");

    @Test
    void domainsOnlyDependInTheAllowedDirection() throws IOException {
        List<String> violations = new ArrayList<>();

        for (Path file : javaFiles()) {
            String homeDomain = homeDomainOf(file);
            if (homeDomain == null) {
                continue;
            }

            for (String line : Files.readAllLines(file)) {
                Matcher matcher = DOMAIN_IMPORT.matcher(line);
                if (!matcher.find()) {
                    continue;
                }

                String importedDomain = matcher.group(1);
                if (importedDomain.equals(homeDomain)) {
                    continue;
                }

                if (!ALLOWED_DEPENDENCIES.getOrDefault(homeDomain, Set.of()).contains(importedDomain)) {
                    violations.add(file + ": " + line.trim());
                }
            }
        }

        assertThat(violations).as("Domain darf nur in Richtung shared/user/group/task abhängen (siehe CLAUDE.md)")
                .isEmpty();
    }

    @Test
    void domainsDoNotReachIntoAnotherDomainsRepositoryDirectly() throws IOException {
        List<String> violations = new ArrayList<>();

        for (Path file : javaFiles()) {
            String homeDomain = homeDomainOf(file);
            if (homeDomain == null) {
                continue;
            }

            for (String line : Files.readAllLines(file)) {
                Matcher matcher = REPOSITORY_IMPORT.matcher(line);
                if (matcher.find() && !matcher.group(1).equals(homeDomain)) {
                    violations.add(file + ": " + line.trim());
                }
            }
        }

        assertThat(violations)
                .as("Cross-Domain-Zugriff muss über den Service der jeweiligen Domain laufen, nie ihr Repository")
                .isEmpty();
    }

    private static List<Path> javaFiles() throws IOException {
        try (Stream<Path> walk = Files.walk(MAIN_JAVA)) {
            return walk.filter(p -> p.toString().endsWith(".java")).toList();
        } catch (UncheckedIOException e) {
            throw e.getCause();
        }
    }

    // Die Domain ist das erste Package-Segment nach .../domain/recur/, z.B.
    // "task" für .../recur/task/service/TaskService.java. Dateien direkt in
    // .../recur/ (RecurApplication) gehören zu keiner Domain.
    private static String homeDomainOf(Path file) {
        Path relative = MAIN_JAVA.relativize(file);
        return relative.getNameCount() > 1 ? relative.getName(0).toString() : null;
    }
}
