package np.gov.egov.tracker.domain;

public enum Sector {
    ROADS("Roads & Transport"),
    DRINKING_WATER("Drinking Water"),
    EDUCATION("Education"),
    DRAINAGE("Drainage & Sanitation");

    private final String label;

    Sector(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
