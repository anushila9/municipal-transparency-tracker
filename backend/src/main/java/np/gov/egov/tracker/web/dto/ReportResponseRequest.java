package np.gov.egov.tracker.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportResponseRequest(@NotBlank @Size(max = 2000) String response) {
}
