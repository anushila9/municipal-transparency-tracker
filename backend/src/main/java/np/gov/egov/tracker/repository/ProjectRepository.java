package np.gov.egov.tracker.repository;

import np.gov.egov.tracker.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    @Query("select distinct p.wardNo from Project p order by p.wardNo")
    List<Integer> findDistinctWardNos();

    @Query("select distinct p.fiscalYear from Project p order by p.fiscalYear desc")
    List<String> findDistinctFiscalYears();
}
