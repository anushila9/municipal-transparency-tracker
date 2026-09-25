package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.StatusHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {

    @EntityGraph(attributePaths = "changedBy")
    List<StatusHistory> findByProjectIdOrderByChangedAtAsc(Long projectId);
}
