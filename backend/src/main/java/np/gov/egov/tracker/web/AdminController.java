package np.gov.egov.tracker.web;

import np.gov.egov.tracker.repository.AdminUserRepository;
import np.gov.egov.tracker.web.dto.AdminProfile;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Admin-only endpoints. Every route here requires a valid admin JWT (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminUserRepository admins;

    public AdminController(AdminUserRepository admins) {
        this.admins = admins;
    }

    @GetMapping("/me")
    public AdminProfile me(@AuthenticationPrincipal Jwt jwt) {
        return admins.findById(Long.valueOf(jwt.getSubject()))
                .map(AdminProfile::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin account no longer exists"));
    }
}
