-- Adds the CONSTRUCTION and RECREATION sectors (kept in sync with the Sector enum).
ALTER TABLE project DROP CONSTRAINT project_sector_check;
ALTER TABLE project ADD CONSTRAINT project_sector_check
    CHECK (sector IN ('ROADS', 'DRINKING_WATER', 'EDUCATION', 'DRAINAGE', 'CONSTRUCTION', 'RECREATION'));
