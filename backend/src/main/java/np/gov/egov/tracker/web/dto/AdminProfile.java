package np.gov.egov.tracker.web.dto;

import np.gov.egov.tracker.domain.AdminUser;

public record AdminProfile(Long id, String name, String email, String role) {

    public static AdminProfile from(AdminUser a) {
        return new AdminProfile(a.getId(), a.getName(), a.getEmail(), a.getRole().name());
    }
}
