package np.gov.egov.tracker.service;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import np.gov.egov.tracker.domain.AdminUser;
import np.gov.egov.tracker.domain.AuditLog;
import np.gov.egov.tracker.domain.CitizenReport;
import np.gov.egov.tracker.repository.AuditLogRepository;
import np.gov.egov.tracker.repository.CitizenReportRepository;
import np.gov.egov.tracker.web.dto.PageResponse;
import np.gov.egov.tracker.web.dto.ReportCounts;
import np.gov.egov.tracker.web.dto.ReportView;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ReportAdminService {

    public enum State { ALL, OPEN, RESPONDED }

    private final CitizenReportRepository reports;
    private final AuditLogRepository audit;

    public ReportAdminService(CitizenReportRepository reports, AuditLogRepository audit) {
        this.reports = reports;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportView> search(State state, Long projectId, int page, int size) {
        Specification<CitizenReport> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (state == State.OPEN) where.add(cb.isNull(root.get("adminResponse")));
            if (state == State.RESPONDED) where.add(cb.isNotNull(root.get("adminResponse")));
            if (projectId != null) where.add(cb.equal(root.join("project", JoinType.INNER).get("id"), projectId));
            return cb.and(where.toArray(Predicate[]::new));
        };
        // Oldest open reports first would bury new ones; newest first matches an inbox.
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt").and(Sort.by("id")));
        return PageResponse.of(reports.findAll(spec, pageable), ReportView::from);
    }

    @Transactional(readOnly = true)
    public ReportCounts counts() {
        return new ReportCounts(reports.countByAdminResponseIsNull(), reports.countByAdminResponseIsNotNull());
    }

    public ReportView respond(Long id, String response, AdminUser admin) {
        CitizenReport r = reports.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report " + id + " not found"));
        String cleaned = ProjectAdminService.clean(response);
        if (cleaned == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Response cannot be empty");
        Instant now = Instant.now();
        audit.save(new AuditLog("CitizenReport", r.getId(), "adminResponse", r.getAdminResponse(), cleaned, admin, now));
        r.respond(cleaned, admin, now);
        return ReportView.from(r);
    }
}
