package np.gov.egov.tracker.web.dto;

import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;
import np.gov.egov.tracker.domain.StatusHistory;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ProjectDetail(
        Long id,
        String title,
        String description,
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
        Instant createdAt,
        Instant updatedAt,
        List<StatusChange> statusHistory) {

    public static ProjectDetail from(Project p, List<StatusHistory> history) {
        return new ProjectDetail(p.getId(), p.getTitle(), p.getDescription(), p.getWardNo(), p.getLocation(),
                p.getSector(), p.getFiscalYear(), p.getBudgetAllocated(), p.getBudgetSpent(),
                ProjectSummary.utilization(p), p.getStartDate(), p.getTargetEndDate(), p.getStatus(),
                ProjectSummary.isOverdue(p), p.getCreatedAt(), p.getUpdatedAt(),
                history.stream().map(StatusChange::from).toList());
    }

    public record StatusChange(ProjectStatus previousStatus, ProjectStatus newStatus, String changedBy,
                               Instant changedAt, String note) {
        static StatusChange from(StatusHistory h) {
            return new StatusChange(h.getPreviousStatus(), h.getNewStatus(), h.getChangedBy().getName(),
                    h.getChangedAt(), h.getNote());
        }
    }
}
