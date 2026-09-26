package np.gov.egov.tracker.web.dto;

import java.time.Instant;

/** What a citizen gets back after submitting: confirmation only, no ids or other reports' data. */
public record ReportReceipt(Instant submittedAt, boolean withPhoto) {
}
