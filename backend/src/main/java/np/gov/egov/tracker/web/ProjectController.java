package np.gov.egov.tracker.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;
import np.gov.egov.tracker.service.ProjectQueryService;
import np.gov.egov.tracker.service.ProjectQueryService.Filter;
import np.gov.egov.tracker.service.ProjectQueryService.SortOption;
import np.gov.egov.tracker.web.dto.PageResponse;
import np.gov.egov.tracker.web.dto.ProjectDetail;
import np.gov.egov.tracker.web.dto.ProjectSummary;
import np.gov.egov.tracker.web.dto.PublicReport;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** Public, read-only project endpoints (no login required). */
@RestController
@RequestMapping("/api/projects")
@Validated
public class ProjectController {

    private final ProjectQueryService service;

    public ProjectController(ProjectQueryService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<ProjectSummary> list(
            @RequestParam(required = false) @Min(1) Integer ward,
            @RequestParam(required = false) Sector sector,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) @Size(max = 7) String fiscalYear,
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(defaultValue = "RECENT") SortOption sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(100) int size) {
        return service.search(new Filter(ward, sector, status, fiscalYear, q), sort, page, size);
    }

    @GetMapping("/{id}")
    public ProjectDetail get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/reports")
    public PageResponse<PublicReport> reports(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        return service.reports(id, page, size);
    }
}
