package np.gov.egov.tracker.web;

import np.gov.egov.tracker.web.dto.AdminProfile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin-only endpoints. Every route under /api/admin requires a valid admin JWT (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CurrentAdmin currentAdmin;

    public AdminController(CurrentAdmin currentAdmin) {
        this.currentAdmin = currentAdmin;
    }

    @GetMapping("/me")
    public AdminProfile me(@AuthenticationPrincipal Jwt jwt) {
        return AdminProfile.from(currentAdmin.from(jwt));
    }
}
