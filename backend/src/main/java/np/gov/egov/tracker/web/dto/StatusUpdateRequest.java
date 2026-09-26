package np.gov.egov.tracker.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.gov.egov.tracker.domain.ProjectStatus;

public record StatusUpdateRequest(@NotNull ProjectStatus status, @Size(max = 1000) String note) {
}
