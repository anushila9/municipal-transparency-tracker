package np.gov.egov.tracker.service;

import jakarta.persistence.criteria.Predicate;
import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;
import np.gov.egov.tracker.repository.ProjectRepository;
import np.gov.egov.tracker.repository.StatusHistoryRepository;
import np.gov.egov.tracker.web.dto.PageResponse;
import np.gov.egov.tracker.web.dto.ProjectDetail;
import np.gov.egov.tracker.web.dto.ProjectSummary;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    public record Filter(Integer ward, Sector sector, ProjectStatus status, String fiscalYear, String q) {
    }

    public enum SortOption {
        RECENT(Sort.by(Sort.Direction.DESC, "updatedAt")),
        BUDGET_DESC(Sort.by(Sort.Direction.DESC, "budgetAllocated")),
        BUDGET_ASC(Sort.by(Sort.Direction.ASC, "budgetAllocated")),
        TITLE(Sort.by(Sort.Direction.ASC, "title"));

        final Sort sort;

        SortOption(Sort sort) {
            this.sort = sort;
        }
    }

    private final ProjectRepository projects;
    private final StatusHistoryRepository history;

    public ProjectQueryService(ProjectRepository projects, StatusHistoryRepository history) {
        this.projects = projects;
        this.history = history;
    }

    public PageResponse<ProjectSummary> search(Filter filter, SortOption sort, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, sort.sort.and(Sort.by("id")));
        return PageResponse.of(projects.findAll(toSpec(filter), pageable), ProjectSummary::from);
    }

    public ProjectDetail get(Long id) {
        Project p = projects.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project " + id + " not found"));
        return ProjectDetail.from(p, history.findByProjectIdOrderByChangedAtAsc(id));
    }

    private static Specification<Project> toSpec(Filter f) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (f.ward() != null) where.add(cb.equal(root.get("wardNo"), f.ward()));
            if (f.sector() != null) where.add(cb.equal(root.get("sector"), f.sector()));
            if (f.status() != null) where.add(cb.equal(root.get("status"), f.status()));
            if (f.fiscalYear() != null && !f.fiscalYear().isBlank()) {
                where.add(cb.equal(root.get("fiscalYear"), f.fiscalYear().trim()));
            }
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + escapeLike(f.q().trim().toLowerCase()) + "%";
                where.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like, '\\'),
                        cb.like(cb.lower(root.get("location")), like, '\\')));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
