package np.gov.egov.tracker.service;

import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;
import np.gov.egov.tracker.repository.ProjectRepository;
import np.gov.egov.tracker.repository.ProjectRepository.Aggregate;
import np.gov.egov.tracker.web.dto.StatsResponse;
import np.gov.egov.tracker.web.dto.StatsResponse.SectorBreakdown;
import np.gov.egov.tracker.web.dto.StatsResponse.StatusCount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StatsService {

    private static final ZoneId NPT = ZoneId.of("Asia/Kathmandu");

    private final ProjectRepository projects;

    public StatsService(ProjectRepository projects) {
        this.projects = projects;
    }

    public StatsResponse stats(String fiscalYear) {
        String fy = fiscalYear == null || fiscalYear.isBlank() ? null : fiscalYear.trim();
        List<Aggregate> rows = projects.aggregate(LocalDate.now(NPT)).stream()
                .filter(r -> fy == null || fy.equals(r.fiscalYear()))
                .toList();

        List<StatusCount> byStatus = Arrays.stream(ProjectStatus.values())
                .map(s -> new StatusCount(s, s.getLabel(), rows.stream().filter(r -> r.status() == s).mapToLong(Aggregate::count).sum()))
                .toList();

        List<SectorBreakdown> bySector = Arrays.stream(Sector.values())
                .map(s -> {
                    List<Aggregate> in = rows.stream().filter(r -> r.sector() == s).toList();
                    return new SectorBreakdown(s, s.getLabel(),
                            in.stream().mapToLong(Aggregate::count).sum(),
                            in.stream().filter(r -> r.status() == ProjectStatus.COMPLETED).mapToLong(Aggregate::count).sum(),
                            sum(in, Aggregate::allocated), sum(in, Aggregate::spent));
                })
                .toList();

        return new StatsResponse(fy,
                rows.stream().mapToLong(Aggregate::count).sum(),
                rows.stream().filter(r -> r.status() == ProjectStatus.COMPLETED).mapToLong(Aggregate::count).sum(),
                rows.stream().mapToLong(Aggregate::overdue).sum(),
                sum(rows, Aggregate::allocated), sum(rows, Aggregate::spent),
                byStatus, bySector);
    }

    private static BigDecimal sum(List<Aggregate> rows, java.util.function.Function<Aggregate, BigDecimal> f) {
        return rows.stream().map(f).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
