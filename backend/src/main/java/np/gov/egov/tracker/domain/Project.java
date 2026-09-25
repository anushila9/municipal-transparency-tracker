package np.gov.egov.tracker.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 4000)
    private String description;

    @Column(name = "ward_no", nullable = false)
    private Integer wardNo;

    @Column(length = 160)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Sector sector;

    /** Nepali fiscal year in Bikram Sambat, e.g. "2083/84". */
    @Column(name = "fiscal_year", nullable = false, length = 7)
    private String fiscalYear;

    @Column(name = "budget_allocated", nullable = false, precision = 15, scale = 2)
    private BigDecimal budgetAllocated;

    @Column(name = "budget_spent", nullable = false, precision = 15, scale = 2)
    private BigDecimal budgetSpent = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "target_end_date")
    private LocalDate targetEndDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getWardNo() { return wardNo; }
    public void setWardNo(Integer wardNo) { this.wardNo = wardNo; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Sector getSector() { return sector; }
    public void setSector(Sector sector) { this.sector = sector; }
    public String getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(String fiscalYear) { this.fiscalYear = fiscalYear; }
    public BigDecimal getBudgetAllocated() { return budgetAllocated; }
    public void setBudgetAllocated(BigDecimal budgetAllocated) { this.budgetAllocated = budgetAllocated; }
    public BigDecimal getBudgetSpent() { return budgetSpent; }
    public void setBudgetSpent(BigDecimal budgetSpent) { this.budgetSpent = budgetSpent; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getTargetEndDate() { return targetEndDate; }
    public void setTargetEndDate(LocalDate targetEndDate) { this.targetEndDate = targetEndDate; }
    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
