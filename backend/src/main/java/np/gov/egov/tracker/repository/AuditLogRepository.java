package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
