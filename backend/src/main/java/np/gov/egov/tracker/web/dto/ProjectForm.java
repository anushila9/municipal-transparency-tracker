package np.gov.egov.tracker.web.dto;

import jakarta.validation.constraints.*;
import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Create/update payload for a project. {@code status} is required on create; on update a different status
 * is recorded as a status change (StatusHistory + AuditLog) with {@code statusNote}, never a silent overwrite.
 */
public record ProjectForm(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String description,
        @NotNull @Min(1) @Max(99) Integer wardNo,
        @Size(max = 160) String location,
        @NotNull Sector sector,
        @NotBlank @Pattern(regexp = "\\d{4}/\\d{2}", message = "must look like 2083/84") String fiscalYear,
        @NotNull @PositiveOrZero @Digits(integer = 13, fraction = 2) BigDecimal budgetAllocated,
        @NotNull @PositiveOrZero @Digits(integer = 13, fraction = 2) BigDecimal budgetSpent,
        LocalDate startDate,
        LocalDate targetEndDate,
        ProjectStatus status,
        @Size(max = 1000) String statusNote) {

    @AssertTrue(message = "must be on or after the start date")
    public boolean isTargetEndDateValid() {
        return startDate == null || targetEndDate == null || !targetEndDate.isBefore(startDate);
    }
}
