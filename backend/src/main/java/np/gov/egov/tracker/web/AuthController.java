package np.gov.egov.tracker.web;

import jakarta.validation.Valid;
import np.gov.egov.tracker.domain.AdminUser;
import np.gov.egov.tracker.repository.AdminUserRepository;
import np.gov.egov.tracker.security.TokenService;
import np.gov.egov.tracker.web.dto.AdminProfile;
import np.gov.egov.tracker.web.dto.LoginRequest;
import np.gov.egov.tracker.web.dto.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminUserRepository admins;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;

    public AuthController(AdminUserRepository admins, PasswordEncoder passwordEncoder, TokenService tokens) {
        this.admins = admins;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AdminUser admin = admins.findByEmailIgnoreCase(request.email().trim())
                .filter(a -> passwordEncoder.matches(request.password(), a.getHashedPassword()))
                // Same message for unknown email and wrong password, so accounts can't be enumerated.
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        TokenService.IssuedToken issued = tokens.issue(admin);
        return new LoginResponse(issued.token(), issued.expiresAt(), AdminProfile.from(admin));
    }
}
