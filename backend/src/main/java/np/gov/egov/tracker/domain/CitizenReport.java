package np.gov.egov.tracker.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "citizen_report")
public class CitizenReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Optional: citizens may report anonymously. */
    @Column(name = "reporter_name", length = 120)
    private String reporterName;

    @Column(nullable = false, length = 2000)
    private String comment;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "admin_response", length = 2000)
    private String adminResponse;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by")
    private AdminUser respondedBy;

    protected CitizenReport() {
    }

    public CitizenReport(Project project, String reporterName, String comment, String photoUrl, Instant submittedAt) {
        this.project = project;
        this.reporterName = reporterName;
        this.comment = comment;
        this.photoUrl = photoUrl;
        this.submittedAt = submittedAt;
    }

    @PrePersist
    void onCreate() {
        if (submittedAt == null) submittedAt = Instant.now();
    }

    public void respond(String response, AdminUser admin, Instant at) {
        this.adminResponse = response;
        this.respondedBy = admin;
        this.respondedAt = at;
    }

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public String getReporterName() { return reporterName; }
    public String getComment() { return comment; }
    public String getPhotoUrl() { return photoUrl; }
    public Instant getSubmittedAt() { return submittedAt; }
    public String getAdminResponse() { return adminResponse; }
    public Instant getRespondedAt() { return respondedAt; }
    public AdminUser getRespondedBy() { return respondedBy; }
}
