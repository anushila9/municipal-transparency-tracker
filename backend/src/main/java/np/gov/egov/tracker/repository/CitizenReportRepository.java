package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.CitizenReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CitizenReportRepository extends JpaRepository<CitizenReport, Long> {
}
