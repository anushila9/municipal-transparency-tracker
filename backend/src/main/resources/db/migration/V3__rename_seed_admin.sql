-- The seeded admin represents the municipality, not a single ward office. Only renames the untouched seed account.
UPDATE admin_user SET name = 'Municipal Admin'
WHERE email = 'admin@tracker.local' AND name = 'Ward 5 Office (Ward Secretary)';
