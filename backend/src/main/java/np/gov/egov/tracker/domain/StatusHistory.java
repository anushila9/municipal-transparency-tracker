package np.gov.egov.tracker.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "status_history")
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Null for the initial status when a project is first recorded. */
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 20)
    private ProjectStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private ProjectStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    private AdminUser changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    @Column(length = 1000)
    private String note;

    protected StatusHistory() {
    }

    public StatusHistory(Project project, ProjectStatus previousStatus, ProjectStatus newStatus,
                         AdminUser changedBy, Instant changedAt, String note) {
        this.project = project;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
        this.note = note;
    }

    @PrePersist
    void onCreate() {
        if (changedAt == null) changedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public ProjectStatus getPreviousStatus() { return previousStatus; }
    public ProjectStatus getNewStatus() { return newStatus; }
    public AdminUser getChangedBy() { return changedBy; }
    public Instant getChangedAt() { return changedAt; }
    public String getNote() { return note; }
}
