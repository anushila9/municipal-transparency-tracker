package np.gov.egov.tracker.web.dto;

import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;

public record ProjectSummary(
        Long id,
        String title,
        Integer wardNo,
        String location,
        Sector sector,
        String fiscalYear,
        BigDecimal budgetAllocated,
        BigDecimal budgetSpent,
        BigDecimal utilizationPercent,
        LocalDate startDate,
        LocalDate targetEndDate,
        ProjectStatus status,
        boolean overdue,
        Instant updatedAt) {

    public static ProjectSummary from(Project p) {
        return new ProjectSummary(p.getId(), p.getTitle(), p.getWardNo(), p.getLocation(), p.getSector(),
                p.getFiscalYear(), p.getBudgetAllocated(), p.getBudgetSpent(), utilization(p),
                p.getStartDate(), p.getTargetEndDate(), p.getStatus(), isOverdue(p), p.getUpdatedAt());
    }

    static BigDecimal utilization(Project p) {
        if (p.getBudgetAllocated().signum() == 0) return BigDecimal.ZERO;
        return p.getBudgetSpent().multiply(BigDecimal.valueOf(100))
                .divide(p.getBudgetAllocated(), 1, RoundingMode.HALF_UP);
    }

    static boolean isOverdue(Project p) {
        return p.getStatus() != ProjectStatus.COMPLETED
                && p.getTargetEndDate() != null
                && p.getTargetEndDate().isBefore(LocalDate.now());
    }
}
