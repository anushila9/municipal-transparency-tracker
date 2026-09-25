-- Core schema for the Municipal Budget & Development Project Transparency Tracker.
-- Mirrors CLAUDE.md Section 7, plus fiscal_year / location on project and responded_by on citizen_report.

CREATE TABLE admin_user (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(160) NOT NULL UNIQUE,
    hashed_password VARCHAR(100) NOT NULL,
    role            VARCHAR(30)  NOT NULL CHECK (role IN ('ADMIN')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE project (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(200)  NOT NULL,
    description      VARCHAR(4000),
    ward_no          INTEGER       NOT NULL CHECK (ward_no > 0),
    location         VARCHAR(160),
    sector           VARCHAR(30)   NOT NULL CHECK (sector IN ('ROADS', 'DRINKING_WATER', 'EDUCATION', 'DRAINAGE')),
    fiscal_year      VARCHAR(7)    NOT NULL,
    budget_allocated NUMERIC(15, 2) NOT NULL CHECK (budget_allocated >= 0),
    budget_spent     NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
    start_date       DATE,
    target_end_date  DATE,
    status           VARCHAR(20)   NOT NULL CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'STALLED', 'COMPLETED')),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Filter columns on the public listing.
CREATE INDEX idx_project_ward   ON project (ward_no);
CREATE INDEX idx_project_sector ON project (sector);
CREATE INDEX idx_project_status ON project (status);

CREATE TABLE status_history (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT      NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status      VARCHAR(20) NOT NULL,
    changed_by      BIGINT      NOT NULL REFERENCES admin_user (id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    note            VARCHAR(1000)
);
CREATE INDEX idx_status_history_project ON status_history (project_id, changed_at);

CREATE TABLE citizen_report (
    id             BIGSERIAL PRIMARY KEY,
    project_id     BIGINT        NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    reporter_name  VARCHAR(120),
    comment        VARCHAR(2000) NOT NULL,
    photo_url      VARCHAR(500),
    submitted_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    admin_response VARCHAR(2000),
    responded_at   TIMESTAMPTZ,
    responded_by   BIGINT REFERENCES admin_user (id)
);
CREATE INDEX idx_citizen_report_project ON citizen_report (project_id, submitted_at);

CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    entity_type   VARCHAR(40)  NOT NULL,
    entity_id     BIGINT       NOT NULL,
    field_changed VARCHAR(60)  NOT NULL,
    old_value     VARCHAR(4000),
    new_value     VARCHAR(4000),
    changed_by    BIGINT       NOT NULL REFERENCES admin_user (id),
    changed_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id, changed_at);
