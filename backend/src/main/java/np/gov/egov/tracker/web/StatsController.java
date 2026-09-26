package np.gov.egov.tracker.web;

import jakarta.validation.constraints.Size;
import np.gov.egov.tracker.service.StatsService;
import np.gov.egov.tracker.web.dto.StatsResponse;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public dashboard figures: aggregates of data that is already public per project. */
@RestController
@Validated
public class StatsController {

    private final StatsService service;

    public StatsController(StatsService service) {
        this.service = service;
    }

    @GetMapping("/api/stats")
    public StatsResponse stats(@RequestParam(required = false) @Size(max = 7) String fiscalYear) {
        return service.stats(fiscalYear);
    }
}
