package np.gov.egov.tracker.web.dto;

import java.time.Instant;

public record LoginResponse(String token, Instant expiresAt, AdminProfile admin) {
}
