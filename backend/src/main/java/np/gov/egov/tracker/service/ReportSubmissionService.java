package np.gov.egov.tracker.service;

import np.gov.egov.tracker.domain.CitizenReport;
import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.repository.CitizenReportRepository;
import np.gov.egov.tracker.repository.ProjectRepository;
import np.gov.egov.tracker.service.ReportPhotoStorage.InvalidPhotoException;
import np.gov.egov.tracker.web.dto.ReportReceipt;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Accepts citizen reports from the public, unauthenticated endpoint. Nothing from the request is trusted:
 * text is sanitised and then validated on the sanitised value (so padding with invisible characters can't
 * slip past the limits), and photos are re-encoded by {@link ReportPhotoStorage}. All checks run before
 * anything is written.
 */
@Service
public class ReportSubmissionService {

    public static final int COMMENT_MIN = 10;
    public static final int COMMENT_MAX = 2_000;
    public static final int NAME_MAX = 120;
    /** Anything this long can't be valid after cleaning either; reject before running regexes over it. */
    private static final int RAW_TEXT_LIMIT = 10_000;
    private static final Pattern HAS_LETTER_OR_DIGIT = Pattern.compile("[\\p{L}\\p{N}]");
    private static final Pattern HAS_LETTER = Pattern.compile("\\p{L}");

    private final ProjectRepository projects;
    private final CitizenReportRepository reports;
    private final ReportPhotoStorage photos;

    public ReportSubmissionService(ProjectRepository projects, CitizenReportRepository reports, ReportPhotoStorage photos) {
        this.projects = projects;
        this.reports = reports;
        this.photos = photos;
    }

    /** @param photo raw upload bytes, or null when no photo was attached */
    public ReportReceipt submit(Long projectId, String rawName, String rawComment, byte[] photo) {
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project " + projectId + " not found"));

        Map<String, String> errors = new LinkedHashMap<>();
        String comment = null;
        String name = null;

        if (rawComment != null && rawComment.length() > RAW_TEXT_LIMIT) {
            errors.put("comment", "Keep your report under " + COMMENT_MAX + " characters.");
        } else {
            comment = TextSanitizer.multiLine(rawComment);
            int len = TextSanitizer.length(comment);
            if (comment == null) errors.put("comment", "Describe what you saw.");
            else if (len < COMMENT_MIN) errors.put("comment", "Please write at least " + COMMENT_MIN + " characters.");
            else if (len > COMMENT_MAX) errors.put("comment", "Keep your report under " + COMMENT_MAX + " characters.");
            else if (!HAS_LETTER_OR_DIGIT.matcher(comment).find()) errors.put("comment", "Describe what you saw in words.");
        }

        if (rawName != null && rawName.length() > RAW_TEXT_LIMIT) {
            errors.put("reporterName", "Name must be " + NAME_MAX + " characters or fewer.");
        } else {
            name = TextSanitizer.singleLine(rawName);
            if (TextSanitizer.length(name) > NAME_MAX) errors.put("reporterName", "Name must be " + NAME_MAX + " characters or fewer.");
            else if (name != null && !HAS_LETTER.matcher(name).find()) errors.put("reporterName", "Enter a name, or leave this blank to stay anonymous.");
        }

        // Only process the photo once the text is valid, so a bad comment doesn't cost an image decode.
        String photoKey = null;
        if (errors.isEmpty() && photo != null) {
            try {
                photoKey = photos.store(photo);
            } catch (InvalidPhotoException e) {
                errors.put("photo", e.getMessage());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the photo. Please try again.", e);
            }
        }
        if (!errors.isEmpty()) throw new FieldValidationException(errors);

        try {
            CitizenReport saved = reports.save(new CitizenReport(project, name, comment, photoKey, Instant.now()));
            return new ReportReceipt(saved.getSubmittedAt(), photoKey != null);
        } catch (RuntimeException e) {
            if (photoKey != null) photos.delete(photoKey);
            throw e;
        }
    }
}
