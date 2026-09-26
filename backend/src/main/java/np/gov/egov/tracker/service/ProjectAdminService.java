package np.gov.egov.tracker.service;

import np.gov.egov.tracker.domain.*;
import np.gov.egov.tracker.repository.AuditLogRepository;
import np.gov.egov.tracker.repository.CitizenReportRepository;
import np.gov.egov.tracker.repository.ProjectRepository;
import np.gov.egov.tracker.repository.StatusHistoryRepository;
import np.gov.egov.tracker.web.dto.ProjectDetail;
import np.gov.egov.tracker.web.dto.ProjectForm;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

/**
 * Every admin mutation of a project goes through here, so each one is written to the AuditLog and every status
 * change also lands in StatusHistory.
 */
@Service
@Transactional
public class ProjectAdminService {

    static final String ENTITY = "Project";

    private final ProjectRepository projects;
    private final StatusHistoryRepository history;
    private final AuditLogRepository audit;
    private final ProjectQueryService query;
    private final CitizenReportRepository reports;
    private final ReportPhotoStorage photos;

    public ProjectAdminService(ProjectRepository projects, StatusHistoryRepository history, AuditLogRepository audit,
                               ProjectQueryService query, CitizenReportRepository reports, ReportPhotoStorage photos) {
        this.projects = projects;
        this.history = history;
        this.audit = audit;
        this.query = query;
        this.reports = reports;
        this.photos = photos;
    }

    public ProjectDetail create(ProjectForm form, AdminUser admin) {
        if (form.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required when creating a project");
        }
        Project p = new Project();
        apply(p, form);
        p.setStatus(form.status());
        projects.save(p);

        Instant now = Instant.now();
        audit.save(new AuditLog(ENTITY, p.getId(), "created", null, p.getTitle(), admin, now));
        history.save(new StatusHistory(p, null, p.getStatus(), admin, now, clean(form.statusNote())));
        return query.get(p.getId());
    }

    public ProjectDetail update(Long id, ProjectForm form, AdminUser admin) {
        Project p = find(id);
        Instant now = Instant.now();
        Project before = snapshot(p);
        apply(p, form);

        logChange(p, before, "title", Project::getTitle, admin, now);
        logChange(p, before, "description", Project::getDescription, admin, now);
        logChange(p, before, "wardNo", Project::getWardNo, admin, now);
        logChange(p, before, "location", Project::getLocation, admin, now);
        logChange(p, before, "sector", Project::getSector, admin, now);
        logChange(p, before, "fiscalYear", Project::getFiscalYear, admin, now);
        logChange(p, before, "budgetAllocated", x -> plain(x.getBudgetAllocated()), admin, now);
        logChange(p, before, "budgetSpent", x -> plain(x.getBudgetSpent()), admin, now);
        logChange(p, before, "startDate", Project::getStartDate, admin, now);
        logChange(p, before, "targetEndDate", Project::getTargetEndDate, admin, now);

        if (form.status() != null && form.status() != p.getStatus()) {
            recordStatusChange(p, form.status(), form.statusNote(), admin, now);
        }
        // Flush so updated_at (set by @PreUpdate) is current in the response.
        projects.saveAndFlush(p);
        return query.get(p.getId());
    }

    public ProjectDetail changeStatus(Long id, ProjectStatus status, String note, AdminUser admin) {
        Project p = find(id);
        if (status == p.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project is already " + status.getLabel());
        }
        recordStatusChange(p, status, note, admin, Instant.now());
        projects.saveAndFlush(p);
        return query.get(p.getId());
    }

    public void delete(Long id, AdminUser admin) {
        Project p = find(id);
        // Status history and citizen reports are removed by ON DELETE CASCADE; the audit trail is kept.
        audit.save(new AuditLog(ENTITY, p.getId(), "deleted", p.getTitle(), null, admin, Instant.now()));
        List<String> photoKeys = reports.findPhotoKeysByProjectId(id);
        projects.delete(p);
        // Report photos live on disk, outside the cascade; remove them only once the delete has committed.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                photoKeys.forEach(photos::delete);
            }
        });
    }

    private void recordStatusChange(Project p, ProjectStatus status, String note, AdminUser admin, Instant at) {
        ProjectStatus previous = p.getStatus();
        p.setStatus(status);
        history.save(new StatusHistory(p, previous, status, admin, at, clean(note)));
        audit.save(new AuditLog(ENTITY, p.getId(), "status", previous.name(), status.name(), admin, at));
    }

    private Project find(Long id) {
        return projects.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project " + id + " not found"));
    }

    private static void apply(Project p, ProjectForm f) {
        p.setTitle(clean(f.title()));
        p.setDescription(clean(f.description()));
        p.setWardNo(f.wardNo());
        p.setLocation(clean(f.location()));
        p.setSector(f.sector());
        p.setFiscalYear(f.fiscalYear().trim());
        p.setBudgetAllocated(f.budgetAllocated());
        p.setBudgetSpent(f.budgetSpent());
        p.setStartDate(f.startDate());
        p.setTargetEndDate(f.targetEndDate());
    }

    private static Project snapshot(Project p) {
        Project s = new Project();
        s.setTitle(p.getTitle());
        s.setDescription(p.getDescription());
        s.setWardNo(p.getWardNo());
        s.setLocation(p.getLocation());
        s.setSector(p.getSector());
        s.setFiscalYear(p.getFiscalYear());
        s.setBudgetAllocated(p.getBudgetAllocated());
        s.setBudgetSpent(p.getBudgetSpent());
        s.setStartDate(p.getStartDate());
        s.setTargetEndDate(p.getTargetEndDate());
        return s;
    }

    private void logChange(Project after, Project before, String field, Function<Project, Object> getter,
                           AdminUser admin, Instant at) {
        String oldValue = str(getter.apply(before));
        String newValue = str(getter.apply(after));
        if (!Objects.equals(oldValue, newValue)) {
            audit.save(new AuditLog(ENTITY, after.getId(), field, oldValue, newValue, admin, at));
        }
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    /** Compares 100.00 and 100 as equal and logs amounts without trailing zeros. */
    private static String plain(BigDecimal d) {
        return d == null ? null : d.stripTrailingZeros().toPlainString();
    }

    /** See {@link TextSanitizer#multiLine}: strips control/invisible characters and turns blank input into null. */
    static String clean(String s) {
        return TextSanitizer.multiLine(s);
    }
}
