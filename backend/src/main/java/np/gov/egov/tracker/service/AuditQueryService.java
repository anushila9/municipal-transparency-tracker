package np.gov.egov.tracker.service;

import np.gov.egov.tracker.domain.AuditLog;
import np.gov.egov.tracker.domain.CitizenReport;
import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.repository.AuditLogRepository;
import np.gov.egov.tracker.repository.CitizenReportRepository;
import np.gov.egov.tracker.repository.ProjectRepository;
import np.gov.egov.tracker.web.dto.AuditEntry;
import np.gov.egov.tracker.web.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AuditQueryService {

    private final AuditLogRepository audit;
    private final ProjectRepository projects;
    private final CitizenReportRepository reports;

    public AuditQueryService(AuditLogRepository audit, ProjectRepository projects, CitizenReportRepository reports) {
        this.audit = audit;
        this.projects = projects;
        this.reports = reports;
    }

    public PageResponse<AuditEntry> search(String entityType, Long entityId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "changedAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<AuditLog> rows;
        if (entityType == null || entityType.isBlank()) rows = audit.findAllBy(pageable);
        else if (entityId == null) rows = audit.findByEntityType(entityType, pageable);
        else rows = audit.findByEntityTypeAndEntityId(entityType, entityId, pageable);

        // Resolve labels for the page in two queries rather than one per row.
        Map<Long, String> projectTitles = projects.findAllById(idsOf(rows, "Project")).stream()
                .collect(Collectors.toMap(Project::getId, Project::getTitle));
        Map<Long, String> reportLabels = reports.findAllById(idsOf(rows, "CitizenReport")).stream()
                .collect(Collectors.toMap(CitizenReport::getId, r -> "Report on " + r.getProject().getTitle()));

        Function<AuditLog, AuditEntry> toEntry = a -> new AuditEntry(a.getId(), a.getEntityType(), a.getEntityId(),
                switch (a.getEntityType()) {
                    case "Project" -> projectTitles.get(a.getEntityId());
                    case "CitizenReport" -> reportLabels.get(a.getEntityId());
                    default -> null;
                },
                a.getFieldChanged(), a.getOldValue(), a.getNewValue(), a.getChangedBy().getName(), a.getChangedAt());
        return PageResponse.of(rows, toEntry);
    }

    private static Set<Long> idsOf(Page<AuditLog> rows, String type) {
        return rows.stream().filter(a -> type.equals(a.getEntityType())).map(AuditLog::getEntityId).collect(Collectors.toSet());
    }
}
