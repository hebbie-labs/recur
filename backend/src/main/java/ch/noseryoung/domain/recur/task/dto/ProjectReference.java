package ch.noseryoung.domain.recur.task.dto;

import java.util.UUID;

/** Minimaler Client-Verweis auf ein bestehendes Project (nur dessen id ist relevant). */
public record ProjectReference(UUID id) {
}
