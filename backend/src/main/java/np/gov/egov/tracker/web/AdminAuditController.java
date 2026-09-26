package np.gov.egov.tracker.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import np.gov.egov.tracker.service.AuditQueryService;
import np.gov.egov.tracker.web.dto.AuditEntry;
import np.gov.egov.tracker.web.dto.PageResponse;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Read-only: the audit trail is never edited through the API. */
@RestController
@RequestMapping("/api/admin/audit")
@Validated
public class AdminAuditController {

    private final AuditQueryService service;

    public AdminAuditController(AuditQueryService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<AuditEntry> list(
            @RequestParam(required = false) @Size(max = 40) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        return service.search(entityType, entityId, page, size);
    }
}
