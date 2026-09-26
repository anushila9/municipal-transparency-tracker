package np.gov.egov.tracker.web.dto;

import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;

import java.math.BigDecimal;
import java.util.List;

/** Dashboard figures, optionally scoped to one fiscal year. */
public record StatsResponse(
        String fiscalYear,
        long projectCount,
        long completedCount,
        long overdueCount,
        BigDecimal totalAllocated,
        BigDecimal totalSpent,
        List<StatusCount> byStatus,
        List<SectorBreakdown> bySector) {

    public record StatusCount(ProjectStatus status, String label, long count) {
    }

    public record SectorBreakdown(Sector sector, String label, long count, long completed,
                                  BigDecimal allocated, BigDecimal spent) {
    }
}
