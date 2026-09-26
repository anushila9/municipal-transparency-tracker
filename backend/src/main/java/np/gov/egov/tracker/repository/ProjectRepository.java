package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    @Query("select distinct p.wardNo from Project p order by p.wardNo")
    List<Integer> findDistinctWardNos();

    @Query("select distinct p.fiscalYear from Project p order by p.fiscalYear desc")
    List<String> findDistinctFiscalYears();

    /** One row per fiscal year / sector / status, with overdue counts; small enough to aggregate in memory. */
    @Query("""
            select new np.gov.egov.tracker.repository.ProjectRepository$Aggregate(
                p.fiscalYear, p.sector, p.status, count(p), sum(p.budgetAllocated), sum(p.budgetSpent),
                sum(case when p.status <> np.gov.egov.tracker.domain.ProjectStatus.COMPLETED
                          and p.targetEndDate < :today then 1 else 0 end))
            from Project p
            group by p.fiscalYear, p.sector, p.status
            """)
    List<Aggregate> aggregate(LocalDate today);

    record Aggregate(String fiscalYear, Sector sector, ProjectStatus status, long count,
                     BigDecimal allocated, BigDecimal spent, long overdue) {
    }
}
