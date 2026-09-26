package np.gov.egov.tracker.service;

import java.util.Map;

/** Validation failure on specific fields; rendered as 400 problem+json with an {@code errors} map. */
public class FieldValidationException extends RuntimeException {

    private final Map<String, String> errors;

    public FieldValidationException(Map<String, String> errors) {
        super("Some fields need attention.");
        this.errors = Map.copyOf(errors);
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
