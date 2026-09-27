package np.gov.egov.tracker.web.dto;

import np.gov.egov.tracker.domain.CitizenReport;

import java.time.Instant;

/**
 * A citizen report as the public sees it on a project page: the comment and the municipality's reply.
 * Deliberately leaves out the reporter's name and photo; citizens recognise their report by what they wrote.
 */
public record PublicReport(Long id, String comment, Instant submittedAt, String response, Instant respondedAt) {

    public static PublicReport from(CitizenReport r) {
        return new PublicReport(r.getId(), r.getComment(), r.getSubmittedAt(), r.getAdminResponse(), r.getRespondedAt());
    }
}
