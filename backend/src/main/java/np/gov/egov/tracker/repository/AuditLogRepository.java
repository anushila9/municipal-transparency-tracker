package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @EntityGraph(attributePaths = "changedBy")
    Page<AuditLog> findAllBy(Pageable pageable);

    @EntityGraph(attributePaths = "changedBy")
    Page<AuditLog> findByEntityType(String entityType, Pageable pageable);

    @EntityGraph(attributePaths = "changedBy")
    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);
}
