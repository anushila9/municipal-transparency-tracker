package np.gov.egov.tracker.domain;

public enum ProjectStatus {
    NOT_STARTED("Not Started"),
    IN_PROGRESS("In Progress"),
    STALLED("Stalled"),
    COMPLETED("Completed");

    private final String label;

    ProjectStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
