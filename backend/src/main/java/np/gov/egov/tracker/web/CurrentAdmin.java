package np.gov.egov.tracker.web;

import np.gov.egov.tracker.domain.AdminUser;
import np.gov.egov.tracker.repository.AdminUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Resolves the admin behind a validated JWT, so mutations can be attributed in StatusHistory and AuditLog. */
@Component
public class CurrentAdmin {

    private final AdminUserRepository admins;

    public CurrentAdmin(AdminUserRepository admins) {
        this.admins = admins;
    }

    public AdminUser from(Jwt jwt) {
        return admins.findById(Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin account no longer exists"));
    }
}
