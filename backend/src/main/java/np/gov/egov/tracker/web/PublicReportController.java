package np.gov.egov.tracker.web;

import jakarta.servlet.http.HttpServletRequest;
import np.gov.egov.tracker.service.FieldValidationException;
import np.gov.egov.tracker.service.ReportPhotoStorage;
import np.gov.egov.tracker.service.ReportSubmissionService;
import np.gov.egov.tracker.service.SubmissionRateLimiter;
import np.gov.egov.tracker.web.dto.ReportReceipt;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.OptionalLong;
import java.util.Set;

/**
 * Citizen report submission: public and unauthenticated by design (CLAUDE.md §3), so it is rate limited and every
 * field is validated server-side regardless of what the frontend checked.
 *
 * <p>Accepts multipart/form-data with parts {@code comment}, optional {@code reporterName}, optional {@code photo},
 * and {@code website}, a honeypot left empty by people and filled in by form-spamming bots.
 * Overall request and file sizes are capped by {@code spring.servlet.multipart.*} before this code runs.
 */
@RestController
public class PublicReportController {

    private static final Set<String> TEXT_FIELDS = Set.of("comment", "reporterName", "website");
    private static final Set<String> FILE_FIELDS = Set.of("photo");

    private final ReportSubmissionService service;
    private final SubmissionRateLimiter rateLimiter;

    public PublicReportController(ReportSubmissionService service, SubmissionRateLimiter rateLimiter) {
        this.service = service;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping(path = "/api/projects/{id}/reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submit(@PathVariable Long id, MultipartHttpServletRequest request) throws IOException {
        OptionalLong retryAfter = rateLimiter.tryAcquire(clientKey(request));
        if (retryAfter.isPresent()) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS,
                    "You've sent several reports in a short time. Please wait a few minutes and try again.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter.getAsLong()))
                    .body(problem);
        }

        rejectMalformedParts(request);

        // Honeypot: pretend it worked so the bot moves on, but store nothing.
        String honeypot = request.getParameter("website");
        if (honeypot != null && !honeypot.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(new ReportReceipt(Instant.now(), false));
        }

        MultipartFile photo = request.getFile("photo");
        byte[] photoBytes = null;
        if (photo != null && !photo.isEmpty()) {
            if (photo.getSize() > ReportPhotoStorage.MAX_BYTES) {
                throw new FieldValidationException(Map.of("photo", "Photo must be 5 MB or smaller."));
            }
            photoBytes = photo.getBytes();
        }

        ReportReceipt receipt = service.submit(id, request.getParameter("reporterName"), request.getParameter("comment"), photoBytes);
        return ResponseEntity.status(HttpStatus.CREATED).body(receipt);
    }

    /** Rejects repeated or unexpected fields instead of silently picking one (Spring would join repeats with commas). */
    private static void rejectMalformedParts(MultipartHttpServletRequest request) {
        for (Map.Entry<String, String[]> e : request.getParameterMap().entrySet()) {
            if (!TEXT_FIELDS.contains(e.getKey())) {
                throw new FieldValidationException(Map.of(e.getKey(), "Unexpected field."));
            }
            if (e.getValue().length > 1) throw new FieldValidationException(Map.of(e.getKey(), "Send this field only once."));
        }
        for (Map.Entry<String, List<MultipartFile>> e : request.getMultiFileMap().entrySet()) {
            if (!FILE_FIELDS.contains(e.getKey())) throw new FieldValidationException(Map.of(e.getKey(), "Unexpected file."));
            if (e.getValue().size() > 1) throw new FieldValidationException(Map.of(e.getKey(), "Attach one photo at most."));
        }
    }

    private static String clientKey(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
