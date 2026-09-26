package np.gov.egov.tracker.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import np.gov.egov.tracker.service.ReportAdminService;
import np.gov.egov.tracker.service.ReportPhotoStorage;
import np.gov.egov.tracker.service.ReportAdminService.State;
import np.gov.egov.tracker.web.dto.PageResponse;
import np.gov.egov.tracker.web.dto.ReportCounts;
import np.gov.egov.tracker.web.dto.ReportResponseRequest;
import np.gov.egov.tracker.web.dto.ReportView;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

@RestController
@RequestMapping("/api/admin/reports")
@Validated
public class AdminReportController {

    private final ReportAdminService service;
    private final CurrentAdmin currentAdmin;
    private final ReportPhotoStorage photos;

    public AdminReportController(ReportAdminService service, CurrentAdmin currentAdmin, ReportPhotoStorage photos) {
        this.service = service;
        this.currentAdmin = currentAdmin;
        this.photos = photos;
    }

    @GetMapping
    public PageResponse<ReportView> list(
            @RequestParam(defaultValue = "ALL") State state,
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.search(state, projectId, page, size);
    }

    @GetMapping("/counts")
    public ReportCounts counts() {
        return service.counts();
    }

    @PutMapping("/{id}/response")
    public ReportView respond(@PathVariable Long id, @Valid @RequestBody ReportResponseRequest request,
                              @AuthenticationPrincipal Jwt jwt) {
        return service.respond(id, request.response(), currentAdmin.from(jwt));
    }

    /** Report photos are admin-only (reports aren't public), so they're served here rather than as static files. */
    @GetMapping("/{id}/photo")
    public ResponseEntity<Resource> photo(@PathVariable Long id) {
        return photos.find(service.photoKey(id))
                .map(path -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        // Private: never stored by shared caches.
                        .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                        .<Resource>body(new FileSystemResource(path)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This report has no photo"));
    }
}
