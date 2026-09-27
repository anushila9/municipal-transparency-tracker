package np.gov.egov.tracker.config;

import np.gov.egov.tracker.domain.*;
import np.gov.egov.tracker.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static np.gov.egov.tracker.domain.ProjectStatus.*;
import static np.gov.egov.tracker.domain.Sector.*;

/**
 * Seeds an illustrative single-ward dataset (Ward 5) modelled on typical ward-level budget line items.
 * Runs only when the project table is empty, so it never touches real data.
 * Amounts are NPR; fiscal years are Bikram Sambat (FY 2083/84 began mid-July 2026).
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final ZoneId NPT = ZoneId.of("Asia/Kathmandu");
    private static final int WARD = 5;

    private final ProjectRepository projects;
    private final StatusHistoryRepository history;
    private final CitizenReportRepository reports;
    private final AdminUserRepository admins;
    private final AuditLogRepository audit;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataSeeder(ProjectRepository projects, StatusHistoryRepository history, CitizenReportRepository reports,
                      AdminUserRepository admins, AuditLogRepository audit, PasswordEncoder passwordEncoder,
                      @Value("${app.seed.admin-email}") String adminEmail,
                      @Value("${app.seed.admin-password}") String adminPassword) {
        this.projects = projects;
        this.history = history;
        this.reports = reports;
        this.admins = admins;
        this.audit = audit;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (projects.count() > 0) {
            log.info("Seed skipped: projects already exist");
            return;
        }

        AdminUser admin = admins.findByEmailIgnoreCase(adminEmail).orElseGet(this::createSeedAdmin);

        List<Seed> seeds = List.of(
                // ---- Roads ----
                new Seed("Blacktopping of Bhimsen Tole – Ganesh Mandir Road (1.2 km)",
                        "Upgrading the existing gravel road to a 4 m wide bituminous (DBST) surface with side drains on both sides.",
                        "Bhimsen Tole", ROADS, "2082/83", 12_500_000, 11_840_000, d(2025, 9, 15), d(2026, 4, 30),
                        step(d(2025, 8, 20), NOT_STARTED, "Approved by the ward assembly; tender notice published."),
                        step(d(2025, 9, 15), IN_PROGRESS, "Work order issued to contractor; subgrade preparation started."),
                        step(d(2026, 4, 22), COMPLETED, "Final inspection by municipal engineer passed.")),
                new Seed("Gravelling of Kalimati Danda Link Road (800 m)",
                        "Gravelling and camber correction of the seasonal link road connecting Kalimati Danda to the ward centre.",
                        "Kalimati Danda", ROADS, "2083/84", 1_850_000, 410_000, d(2026, 8, 10), d(2026, 12, 31),
                        step(d(2026, 7, 25), NOT_STARTED, "Included in FY 2083/84 ward programme."),
                        step(d(2026, 8, 10), IN_PROGRESS, "Users' committee formed; material delivery started.")),
                new Seed("Retaining Wall at Khahare Khola Road Section",
                        "Gabion and stone-masonry retaining wall (60 m) to protect the road section damaged by the 2082 monsoon.",
                        "Khahare Khola", ROADS, "2082/83", 3_200_000, 2_175_000, d(2025, 11, 1), d(2026, 5, 31),
                        step(d(2025, 10, 10), NOT_STARTED, "Emergency allocation approved."),
                        step(d(2025, 11, 1), IN_PROGRESS, "Excavation and gabion box installation started."),
                        step(d(2026, 6, 18), STALLED, "Work halted after fresh landslide; redesign requested from the municipal engineering section.")),
                new Seed("Solar Street Lights on Ward Main Road (45 poles)",
                        "Installation of 45 solar-powered LED street lights along the main road from the ward office to Majhgaun chowk.",
                        "Ward Office – Majhgaun Chowk", ROADS, "2082/83", 1_480_000, 1_462_500, d(2025, 12, 5), d(2026, 2, 28),
                        step(d(2025, 11, 20), NOT_STARTED, "Supplier selected through sealed quotation."),
                        step(d(2025, 12, 5), IN_PROGRESS, "Pole installation started."),
                        step(d(2026, 2, 20), COMPLETED, "All 45 lights installed and handed over.")),

                // ---- Drinking water ----
                new Seed("Deep Tubewell and Overhead Tank, Saraswati Tole",
                        "Drilling a 120 m deep tubewell with a 50,000-litre overhead tank and distribution taps for around 180 households.",
                        "Saraswati Tole", DRINKING_WATER, "2082/83", 4_800_000, 3_620_000, d(2026, 1, 10), d(2026, 10, 15),
                        step(d(2025, 12, 15), NOT_STARTED, "Hydro-geological survey completed."),
                        step(d(2026, 1, 10), IN_PROGRESS, "Drilling completed; tank foundation work under way.")),
                new Seed("Drinking Water Pipeline Extension to Majhgaun (2.3 km)",
                        "Laying 2.3 km of HDPE pipeline and 12 public tap stands to extend the existing scheme to Majhgaun.",
                        "Majhgaun", DRINKING_WATER, "2082/83", 2_250_000, 2_210_000, d(2025, 10, 1), d(2026, 3, 31),
                        step(d(2025, 9, 10), NOT_STARTED, "Users' committee agreement signed."),
                        step(d(2025, 10, 1), IN_PROGRESS, "Trenching and pipe laying started."),
                        step(d(2026, 3, 25), COMPLETED, "Water flow tested at all 12 tap stands.")),
                new Seed("Water Source Protection at Mul Dhara",
                        "Fencing, intake chamber and catchment plantation to protect the Mul Dhara spring source.",
                        "Mul Dhara", DRINKING_WATER, "2083/84", 875_000, 0, d(2026, 10, 20), d(2027, 2, 28),
                        step(d(2026, 7, 25), NOT_STARTED, "Included in FY 2083/84 ward programme; cost estimate approved.")),

                // ---- Education ----
                new Seed("Additional Classroom Block, Shree Janakalyan Secondary School",
                        "Two-storey earthquake-resistant block with four classrooms and a staff room, co-funded with the school management committee.",
                        "Janakalyan Chowk", EDUCATION, "2082/83", 9_500_000, 6_130_000, d(2025, 11, 15), d(2026, 11, 30),
                        step(d(2025, 10, 25), NOT_STARTED, "Design approved by the municipal education section."),
                        step(d(2025, 11, 15), IN_PROGRESS, "Ground-floor slab completed; first-floor columns in progress.")),
                new Seed("Toilet Block with Water Facility, Shree Bal Bikas Basic School",
                        "Separate girls' and boys' toilets with handwashing station and overhead water tank.",
                        "Tallo Tole", EDUCATION, "2082/83", 1_240_000, 1_205_000, d(2025, 9, 1), d(2025, 12, 31),
                        step(d(2025, 8, 15), NOT_STARTED, "Approved under school WASH programme."),
                        step(d(2025, 9, 1), IN_PROGRESS, "Construction started."),
                        step(d(2025, 12, 18), COMPLETED, "Handed over to the school management committee.")),
                new Seed("Compound Wall, Shree Saraswati Basic School",
                        "220 m brick compound wall with a main gate for student safety along the highway side.",
                        "Saraswati Tole", EDUCATION, "2082/83", 1_600_000, 1_150_000, d(2025, 12, 1), d(2026, 4, 15),
                        step(d(2025, 11, 10), NOT_STARTED, "Users' committee formed."),
                        step(d(2025, 12, 1), IN_PROGRESS, "Foundation work started."),
                        step(d(2026, 3, 5), STALLED, "Work stopped over a land boundary dispute with an adjoining plot owner.")),
                new Seed("Roof Repair and Seismic Retrofitting, Shree Janajyoti Basic School",
                        "Replacing the damaged CGI roof and retrofitting the load-bearing walls with steel mesh jacketing.",
                        "Upallo Tole", EDUCATION, "2083/84", 2_800_000, 0, d(2026, 11, 1), d(2027, 4, 30),
                        step(d(2026, 7, 25), NOT_STARTED, "Structural assessment report received; awaiting tender.")),

                // ---- Drainage ----
                new Seed("Covered Drain along Bazaar Road (650 m)",
                        "RCC-covered roadside drain to end waterlogging in the bazaar area during monsoon.",
                        "Ward 5 Bazaar", DRAINAGE, "2083/84", 3_800_000, 540_000, d(2026, 7, 28), d(2027, 1, 31),
                        step(d(2026, 7, 20), NOT_STARTED, "Tender awarded."),
                        step(d(2026, 7, 28), IN_PROGRESS, "Excavation started on the northern section.")),
                new Seed("Box Culvert at Chaur Khola Crossing",
                        "Single-cell RCC box culvert replacing the washed-out hume pipe crossing.",
                        "Chaur Khola", DRAINAGE, "2082/83", 960_000, 948_000, d(2026, 1, 20), d(2026, 4, 10),
                        step(d(2026, 1, 5), NOT_STARTED, "Cost estimate approved."),
                        step(d(2026, 1, 20), IN_PROGRESS, "Construction started."),
                        step(d(2026, 4, 2), COMPLETED, "Culvert opened to traffic.")),
                new Seed("Stormwater Drain Cleaning and Repair, Tole 3",
                        "De-silting and repairing broken slabs of the existing 1.1 km stormwater drain network before the next monsoon.",
                        "Tole 3", DRAINAGE, "2083/84", 650_000, 0, d(2027, 2, 1), d(2027, 5, 15),
                        step(d(2026, 7, 25), NOT_STARTED, "Included in FY 2083/84 ward programme."))
        );

        List<Project> saved = new ArrayList<>();
        for (Seed s : seeds) {
            saved.add(seed(s, admin));
        }

        seedReport(saved.get(2), "Hari Bahadur Thapa",
                "The half-built wall is collapsing again and the road is now one lane. Nobody has worked here since Asar.",
                at(d(2026, 7, 12)), admin,
                "Thank you. The engineering section has been asked for a revised design; work will resume after the monsoon.",
                at(d(2026, 7, 16)));
        seedReport(saved.get(9), null,
                "Only half of the wall is built and the rest of the bricks are lying on the playground. Children play near them.",
                at(d(2026, 5, 2)), admin,
                "The site has been cordoned off. The boundary dispute is with the land revenue office for survey.",
                at(d(2026, 5, 6)));
        seedReport(saved.get(4), "Sunita Maharjan",
                "Tank structure is visible but taps are still dry. When will water supply start?",
                at(d(2026, 9, 10)), null, null, null);
        seedReport(saved.get(0), null,
                "Road quality is good but a drain cover near the temple is already broken.",
                at(d(2026, 6, 3)), null, null, null);

        log.info("Seeded {} projects for Ward {}; admin login: {}", saved.size(), WARD, adminEmail);
    }

    private AdminUser createSeedAdmin() {
        String password = adminPassword;
        if (password == null || password.isBlank()) {
            byte[] bytes = new byte[12];
            new SecureRandom().nextBytes(bytes);
            password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            // Printed once, only when the account is first created; set SEED_ADMIN_PASSWORD to choose your own.
            log.warn("Generated admin password for {}: {}", adminEmail, password);
        }
        return admins.save(new AdminUser("Municipal Admin", adminEmail, passwordEncoder.encode(password), AdminRole.ADMIN));
    }

    private Project seed(Seed s, AdminUser admin) {
        Project p = new Project();
        p.setTitle(s.title);
        p.setDescription(s.description);
        p.setWardNo(WARD);
        p.setLocation(s.location);
        p.setSector(s.sector);
        p.setFiscalYear(s.fiscalYear);
        p.setBudgetAllocated(BigDecimal.valueOf(s.allocated));
        p.setBudgetSpent(BigDecimal.valueOf(s.spent));
        p.setStartDate(s.start);
        p.setTargetEndDate(s.targetEnd);
        Step last = s.steps[s.steps.length - 1];
        p.setStatus(last.status);
        p.setCreatedAt(at(s.steps[0].date));
        p.setUpdatedAt(at(last.date));
        projects.save(p);

        audit.save(new AuditLog("Project", p.getId(), "created", null, s.title, admin, at(s.steps[0].date)));
        ProjectStatus previous = null;
        for (Step step : s.steps) {
            history.save(new StatusHistory(p, previous, step.status, admin, at(step.date), step.note));
            if (previous != null) {
                audit.save(new AuditLog("Project", p.getId(), "status", previous.name(), step.status.name(), admin, at(step.date)));
            }
            previous = step.status;
        }
        return p;
    }

    private void seedReport(Project project, String name, String comment, Instant submitted,
                            AdminUser responder, String response, Instant respondedAt) {
        CitizenReport r = new CitizenReport(project, name, comment, null, submitted);
        if (response != null) r.respond(response, responder, respondedAt);
        reports.save(r);
    }

    private static LocalDate d(int y, int m, int day) {
        return LocalDate.of(y, m, day);
    }

    /** 11:00 Nepal time on the given day — a plausible office-hours timestamp. */
    private static Instant at(LocalDate date) {
        return date.atTime(11, 0).atZone(NPT).toInstant();
    }

    private static Step step(LocalDate date, ProjectStatus status, String note) {
        return new Step(date, status, note);
    }

    private record Step(LocalDate date, ProjectStatus status, String note) {
    }

    private record Seed(String title, String description, String location, Sector sector, String fiscalYear,
                        long allocated, long spent, LocalDate start, LocalDate targetEnd, Step... steps) {
    }
}
