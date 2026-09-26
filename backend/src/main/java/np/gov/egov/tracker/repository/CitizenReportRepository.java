package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.CitizenReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;

public interface CitizenReportRepository extends JpaRepository<CitizenReport, Long>, JpaSpecificationExecutor<CitizenReport> {

    @Override
    @EntityGraph(attributePaths = {"project", "respondedBy"})
    Page<CitizenReport> findAll(Specification<CitizenReport> spec, Pageable pageable);

    long countByAdminResponseIsNull();

    long countByAdminResponseIsNotNull();
}
