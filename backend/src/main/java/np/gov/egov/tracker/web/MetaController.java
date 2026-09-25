package np.gov.egov.tracker.web;

import np.gov.egov.tracker.domain.ProjectStatus;
import np.gov.egov.tracker.domain.Sector;
import np.gov.egov.tracker.repository.ProjectRepository;
import np.gov.egov.tracker.web.dto.MetaResponse;
import np.gov.egov.tracker.web.dto.MetaResponse.Option;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController
public class MetaController {

    private final ProjectRepository projects;

    public MetaController(ProjectRepository projects) {
        this.projects = projects;
    }

    @GetMapping("/api/meta")
    public MetaResponse meta() {
        return new MetaResponse(
                projects.findDistinctWardNos(),
                projects.findDistinctFiscalYears(),
                Arrays.stream(Sector.values()).map(s -> new Option(s.name(), s.getLabel())).toList(),
                Arrays.stream(ProjectStatus.values()).map(s -> new Option(s.name(), s.getLabel())).toList());
    }
}
