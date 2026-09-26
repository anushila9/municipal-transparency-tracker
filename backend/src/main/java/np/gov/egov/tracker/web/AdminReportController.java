package np.gov.egov.tracker.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import np.gov.egov.tracker.service.ReportAdminService;
import np.gov.egov.tracker.service.ReportAdminService.State;
import np.gov.egov.tracker.web.dto.PageResponse;
import np.gov.egov.tracker.web.dto.ReportCounts;
import np.gov.egov.tracker.web.dto.ReportResponseRequest;
import np.gov.egov.tracker.web.dto.ReportView;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@Validated
public class AdminReportController {

    private final ReportAdminService service;
    private final CurrentAdmin currentAdmin;

    public AdminReportController(ReportAdminService service, CurrentAdmin currentAdmin) {
        this.service = service;
        this.currentAdmin = currentAdmin;
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
}
