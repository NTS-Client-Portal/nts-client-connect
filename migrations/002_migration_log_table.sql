-- Migration Log Table
-- Purpose: Track all migration operations for audit and debugging
-- Created: 2025-08-23

CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    step VARCHAR(100) NOT NULL,
    message TEXT,
    data_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT current_user
);

CREATE INDEX IF NOT EXISTS idx_migration_log_migration_name ON migration_log(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_log_created_at ON migration_log(created_at);
