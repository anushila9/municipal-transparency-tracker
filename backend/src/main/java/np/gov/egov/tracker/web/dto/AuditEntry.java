package np.gov.egov.tracker.web.dto;

import java.time.Instant;

/** One audit row. {@code entityLabel} is a human-readable name for the record, or null if it no longer exists. */
public record AuditEntry(Long id, String entityType, Long entityId, String entityLabel, String fieldChanged,
                         String oldValue, String newValue, String changedBy, Instant changedAt) {
}
