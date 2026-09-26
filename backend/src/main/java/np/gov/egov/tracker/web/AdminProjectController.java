package np.gov.egov.tracker.web;

import jakarta.validation.Valid;
import np.gov.egov.tracker.service.ProjectAdminService;
import np.gov.egov.tracker.web.dto.ProjectDetail;
import np.gov.egov.tracker.web.dto.ProjectForm;
import np.gov.egov.tracker.web.dto.StatusUpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Project mutations. Reads use the public /api/projects endpoints. */
@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {

    private final ProjectAdminService service;
    private final CurrentAdmin currentAdmin;

    public AdminProjectController(ProjectAdminService service, CurrentAdmin currentAdmin) {
        this.service = service;
        this.currentAdmin = currentAdmin;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDetail create(@Valid @RequestBody ProjectForm form, @AuthenticationPrincipal Jwt jwt) {
        return service.create(form, currentAdmin.from(jwt));
    }

    @PutMapping("/{id}")
    public ProjectDetail update(@PathVariable Long id, @Valid @RequestBody ProjectForm form, @AuthenticationPrincipal Jwt jwt) {
        return service.update(id, form, currentAdmin.from(jwt));
    }

    @PostMapping("/{id}/status")
    public ProjectDetail changeStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request,
                                      @AuthenticationPrincipal Jwt jwt) {
        return service.changeStatus(id, request.status(), request.note(), currentAdmin.from(jwt));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.delete(id, currentAdmin.from(jwt));
    }
}
