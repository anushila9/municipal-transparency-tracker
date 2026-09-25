package np.gov.egov.tracker.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "admin_user")
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "hashed_password", nullable = false, length = 100)
    private String hashedPassword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AdminRole role;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AdminUser() {
    }

    public AdminUser(String name, String email, String hashedPassword, AdminRole role) {
        this.name = name;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.role = role;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getHashedPassword() { return hashedPassword; }
    public AdminRole getRole() { return role; }
    public Instant getCreatedAt() { return createdAt; }
}
