package np.gov.egov.tracker.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "field_changed", nullable = false, length = 60)
    private String fieldChanged;

    @Column(name = "old_value", length = 4000)
    private String oldValue;

    @Column(name = "new_value", length = 4000)
    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    private AdminUser changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected AuditLog() {
    }

    public AuditLog(String entityType, Long entityId, String fieldChanged, String oldValue, String newValue,
                    AdminUser changedBy, Instant changedAt) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.fieldChanged = fieldChanged;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changedBy = changedBy;
        this.changedAt = changedAt;
    }

    @PrePersist
    void onCreate() {
        if (changedAt == null) changedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getFieldChanged() { return fieldChanged; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public AdminUser getChangedBy() { return changedBy; }
    public Instant getChangedAt() { return changedAt; }
}
