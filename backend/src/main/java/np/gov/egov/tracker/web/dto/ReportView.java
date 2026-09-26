package np.gov.egov.tracker.web.dto;

import np.gov.egov.tracker.domain.CitizenReport;
import np.gov.egov.tracker.domain.ProjectStatus;

import java.time.Instant;

/**
 * A citizen report as shown in the admin inbox, with enough project context to act on it. The photo itself is
 * served only to admins, from /api/admin/reports/{id}/photo.
 */
public record ReportView(
        Long id,
        Long projectId,
        String projectTitle,
        Integer projectWardNo,
        ProjectStatus projectStatus,
        String reporterName,
        String comment,
        boolean hasPhoto,
        Instant submittedAt,
        String adminResponse,
        Instant respondedAt,
        String respondedBy) {

    public static ReportView from(CitizenReport r) {
        return new ReportView(r.getId(), r.getProject().getId(), r.getProject().getTitle(), r.getProject().getWardNo(),
                r.getProject().getStatus(), r.getReporterName(), r.getComment(), r.getPhotoUrl() != null, r.getSubmittedAt(),
                r.getAdminResponse(), r.getRespondedAt(), r.getRespondedBy() == null ? null : r.getRespondedBy().getName());
    }
}
