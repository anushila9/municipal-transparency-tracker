package np.gov.egov.tracker.web.dto;

import java.util.List;

/** Filter options and display labels for the frontend. */
public record MetaResponse(List<Integer> wards, List<String> fiscalYears,
                           List<Option> sectors, List<Option> statuses) {

    public record Option(String value, String label) {
    }
}
