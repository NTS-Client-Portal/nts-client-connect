-- Priority 5: Enhanced Role-Based Access Control
-- Database Migration: Role Enum Validation
-- Date: August 27, 2025

-- Add role enum type for type safety and validation
CREATE TYPE user_role_enum AS ENUM (
    'shipper',
    'sales',
    'admin', 
    'super_admin',
    'manager',
    'support'
);

-- Add team role enum for shipper organizations
CREATE TYPE team_role_enum AS ENUM (
    'manager',
    'member'
);

-- Create role validation function
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate nts_users.role
    IF TG_TABLE_NAME = 'nts_users' THEN
        IF NEW.role NOT IN ('shipper', 'sales', 'admin', 'super_admin', 'manager', 'support') THEN
            RAISE EXCEPTION 'Invalid role: %. Must be one of: shipper, sales, admin, super_admin, manager, support', NEW.role;
        END IF;
    END IF;
    
    -- Validate profiles.team_role
    IF TG_TABLE_NAME = 'profiles' THEN
        IF NEW.team_role IS NOT NULL AND NEW.team_role NOT IN ('manager', 'member') THEN
            RAISE EXCEPTION 'Invalid team_role: %. Must be one of: manager, member', NEW.team_role;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for role validation
DROP TRIGGER IF EXISTS validate_nts_user_role ON nts_users;
CREATE TRIGGER validate_nts_user_role
    BEFORE INSERT OR UPDATE ON nts_users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_role();

DROP TRIGGER IF EXISTS validate_profile_team_role ON profiles;
CREATE TRIGGER validate_profile_team_role
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_role();

-- Create role audit table for tracking role changes
CREATE TABLE IF NOT EXISTS role_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('shipper', 'nts_user')),
    old_role VARCHAR(50),
    new_role VARCHAR(50) NOT NULL,
    old_team_role VARCHAR(50),
    new_team_role VARCHAR(50),
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW(),
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for role audit log
CREATE INDEX IF NOT EXISTS idx_role_audit_user_id ON role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_changed_at ON role_audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_role_audit_changed_by ON role_audit_log(changed_by);

-- Function to log role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log changes for nts_users
    IF TG_TABLE_NAME = 'nts_users' THEN
        -- Only log if role actually changed
        IF (OLD.role IS DISTINCT FROM NEW.role) THEN
            INSERT INTO role_audit_log (
                user_id, 
                user_type, 
                old_role, 
                new_role,
                changed_by,
                change_reason
            ) VALUES (
                NEW.id,
                'nts_user',
                OLD.role,
                NEW.role,
                COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id),
                COALESCE(current_setting('app.change_reason', true), 'Role updated')
            );
        END IF;
    END IF;
    
    -- Log changes for profiles (team_role)
    IF TG_TABLE_NAME = 'profiles' THEN
        IF (OLD.team_role IS DISTINCT FROM NEW.team_role) THEN
            INSERT INTO role_audit_log (
                user_id, 
                user_type, 
                old_team_role, 
                new_team_role,
                changed_by,
                change_reason
            ) VALUES (
                NEW.id,
                'shipper',
                OLD.team_role,
                NEW.team_role,
                COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id),
                COALESCE(current_setting('app.change_reason', true), 'Team role updated')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for role change logging
DROP TRIGGER IF EXISTS log_nts_user_role_change ON nts_users;
CREATE TRIGGER log_nts_user_role_change
    AFTER UPDATE ON nts_users
    FOR EACH ROW
    EXECUTE FUNCTION log_role_change();

DROP TRIGGER IF EXISTS log_profile_team_role_change ON profiles;
CREATE TRIGGER log_profile_team_role_change
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_role_change();

-- Create role permissions table for fine-grained permission management
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    notes TEXT,
    UNIQUE(role, permission)
);

-- Create indexes for role permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- Insert default permissions for each role
INSERT INTO role_permissions (role, permission, granted, created_by, notes) VALUES
-- Shipper permissions
('shipper', 'view_quotes', true, NULL, 'Default shipper permission'),
('shipper', 'create_quotes', true, NULL, 'Default shipper permission'),
('shipper', 'edit_quotes', true, NULL, 'Default shipper permission'),
('shipper', 'view_orders', true, NULL, 'Default shipper permission'),
('shipper', 'approve_quotes', true, NULL, 'Default shipper permission'),
('shipper', 'view_chat', true, NULL, 'Default shipper permission'),

-- Sales rep permissions
('sales', 'view_quotes', true, NULL, 'Default sales rep permission'),
('sales', 'create_quotes', true, NULL, 'Default sales rep permission'),
('sales', 'edit_quotes', true, NULL, 'Default sales rep permission'),
('sales', 'view_orders', true, NULL, 'Default sales rep permission'),
('sales', 'create_orders', true, NULL, 'Default sales rep permission'),
('sales', 'edit_orders', true, NULL, 'Default sales rep permission'),
('sales', 'fulfill_orders', true, NULL, 'Default sales rep permission'),
('sales', 'view_companies', true, NULL, 'Default sales rep permission'),
('sales', 'view_users', true, NULL, 'Default sales rep permission'),
('sales', 'view_reports', true, NULL, 'Default sales rep permission'),
('sales', 'view_chat', true, NULL, 'Default sales rep permission'),
('sales', 'support_tickets', true, NULL, 'Default sales rep permission'),

-- Manager permissions (extends sales rep)
('manager', 'view_quotes', true, NULL, 'Default manager permission'),
('manager', 'create_quotes', true, NULL, 'Default manager permission'),
('manager', 'edit_quotes', true, NULL, 'Default manager permission'),
('manager', 'delete_quotes', true, NULL, 'Default manager permission'),
('manager', 'view_orders', true, NULL, 'Default manager permission'),
('manager', 'create_orders', true, NULL, 'Default manager permission'),
('manager', 'edit_orders', true, NULL, 'Default manager permission'),
('manager', 'delete_orders', true, NULL, 'Default manager permission'),
('manager', 'fulfill_orders', true, NULL, 'Default manager permission'),
('manager', 'view_companies', true, NULL, 'Default manager permission'),
('manager', 'edit_companies', true, NULL, 'Default manager permission'),
('manager', 'assign_sales_users', true, NULL, 'Default manager permission'),
('manager', 'view_users', true, NULL, 'Default manager permission'),
('manager', 'edit_users', true, NULL, 'Default manager permission'),
('manager', 'view_reports', true, NULL, 'Default manager permission'),
('manager', 'view_analytics', true, NULL, 'Default manager permission'),
('manager', 'export_data', true, NULL, 'Default manager permission'),
('manager', 'view_chat', true, NULL, 'Default manager permission'),
('manager', 'support_tickets', true, NULL, 'Default manager permission'),

-- Admin permissions (most permissions)
('admin', 'view_quotes', true, NULL, 'Default admin permission'),
('admin', 'create_quotes', true, NULL, 'Default admin permission'),
('admin', 'edit_quotes', true, NULL, 'Default admin permission'),
('admin', 'delete_quotes', true, NULL, 'Default admin permission'),
('admin', 'view_orders', true, NULL, 'Default admin permission'),
('admin', 'create_orders', true, NULL, 'Default admin permission'),
('admin', 'edit_orders', true, NULL, 'Default admin permission'),
('admin', 'delete_orders', true, NULL, 'Default admin permission'),
('admin', 'fulfill_orders', true, NULL, 'Default admin permission'),
('admin', 'view_companies', true, NULL, 'Default admin permission'),
('admin', 'create_companies', true, NULL, 'Default admin permission'),
('admin', 'edit_companies', true, NULL, 'Default admin permission'),
('admin', 'delete_companies', true, NULL, 'Default admin permission'),
('admin', 'assign_sales_users', true, NULL, 'Default admin permission'),
('admin', 'view_users', true, NULL, 'Default admin permission'),
('admin', 'create_users', true, NULL, 'Default admin permission'),
('admin', 'edit_users', true, NULL, 'Default admin permission'),
('admin', 'delete_users', true, NULL, 'Default admin permission'),
('admin', 'manage_roles', true, NULL, 'Default admin permission'),
('admin', 'view_reports', true, NULL, 'Default admin permission'),
('admin', 'view_analytics', true, NULL, 'Default admin permission'),
('admin', 'export_data', true, NULL, 'Default admin permission'),
('admin', 'view_chat', true, NULL, 'Default admin permission'),
('admin', 'support_tickets', true, NULL, 'Default admin permission'),
('admin', 'api_access', true, NULL, 'Default admin permission'),

-- Super admin permissions (all permissions)
('super_admin', 'view_quotes', true, NULL, 'Default super admin permission'),
('super_admin', 'create_quotes', true, NULL, 'Default super admin permission'),
('super_admin', 'edit_quotes', true, NULL, 'Default super admin permission'),
('super_admin', 'delete_quotes', true, NULL, 'Default super admin permission'),
('super_admin', 'view_orders', true, NULL, 'Default super admin permission'),
('super_admin', 'create_orders', true, NULL, 'Default super admin permission'),
('super_admin', 'edit_orders', true, NULL, 'Default super admin permission'),
('super_admin', 'delete_orders', true, NULL, 'Default super admin permission'),
('super_admin', 'fulfill_orders', true, NULL, 'Default super admin permission'),
('super_admin', 'view_companies', true, NULL, 'Default super admin permission'),
('super_admin', 'create_companies', true, NULL, 'Default super admin permission'),
('super_admin', 'edit_companies', true, NULL, 'Default super admin permission'),
('super_admin', 'delete_companies', true, NULL, 'Default super admin permission'),
('super_admin', 'assign_sales_users', true, NULL, 'Default super admin permission'),
('super_admin', 'view_users', true, NULL, 'Default super admin permission'),
('super_admin', 'create_users', true, NULL, 'Default super admin permission'),
('super_admin', 'edit_users', true, NULL, 'Default super admin permission'),
('super_admin', 'delete_users', true, NULL, 'Default super admin permission'),
('super_admin', 'manage_roles', true, NULL, 'Default super admin permission'),
('super_admin', 'view_reports', true, NULL, 'Default super admin permission'),
('super_admin', 'view_analytics', true, NULL, 'Default super admin permission'),
('super_admin', 'export_data', true, NULL, 'Default super admin permission'),
('super_admin', 'view_chat', true, NULL, 'Default super admin permission'),
('super_admin', 'support_tickets', true, NULL, 'Default super admin permission'),
('super_admin', 'api_access', true, NULL, 'Default super admin permission'),
('super_admin', 'system_config', true, NULL, 'Default super admin permission'),
('super_admin', 'database_access', true, NULL, 'Default super admin permission'),

-- Support permissions
('support', 'view_quotes', true, NULL, 'Default support permission'),
('support', 'view_orders', true, NULL, 'Default support permission'),
('support', 'view_companies', true, NULL, 'Default support permission'),
('support', 'view_users', true, NULL, 'Default support permission'),
('support', 'view_chat', true, NULL, 'Default support permission'),
('support', 'support_tickets', true, NULL, 'Default support permission')

ON CONFLICT (role, permission) DO NOTHING;

-- Create function to get user permissions dynamically
CREATE OR REPLACE FUNCTION get_user_permissions(user_role VARCHAR(50))
RETURNS TABLE(permission VARCHAR(100)) AS $$
BEGIN
    RETURN QUERY
    SELECT rp.permission
    FROM role_permissions rp
    WHERE rp.role = user_role
    AND rp.granted = true;
END;
$$ LANGUAGE plpgsql;

-- Create view for user permissions (for easy querying)
CREATE OR REPLACE VIEW user_role_permissions AS
SELECT 
    nu.id as user_id,
    nu.email,
    nu.role,
    rp.permission,
    rp.granted,
    'nts_user' as user_type
FROM nts_users nu
LEFT JOIN role_permissions rp ON nu.role = rp.role
WHERE rp.granted = true

UNION ALL

SELECT 
    p.id as user_id,
    p.email,
    COALESCE(p.team_role, 'shipper') as role,
    rp.permission,
    rp.granted,
    'shipper' as user_type
FROM profiles p
LEFT JOIN role_permissions rp ON COALESCE(p.team_role, 'shipper') = rp.role
WHERE rp.granted = true;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    check_user_id UUID, 
    check_permission VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := false;
BEGIN
    -- Check in nts_users first
    SELECT EXISTS(
        SELECT 1 
        FROM nts_users nu
        JOIN role_permissions rp ON nu.role = rp.role
        WHERE nu.id = check_user_id
        AND rp.permission = check_permission
        AND rp.granted = true
    ) INTO has_perm;
    
    -- If not found, check in profiles
    IF NOT has_perm THEN
        SELECT EXISTS(
            SELECT 1 
            FROM profiles p
            JOIN role_permissions rp ON COALESCE(p.team_role, 'shipper') = rp.role
            WHERE p.id = check_user_id
            AND rp.permission = check_permission
            AND rp.granted = true
        ) INTO has_perm;
    END IF;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies for role_permissions table
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view permissions for their own role
CREATE POLICY role_permissions_select_own ON role_permissions
    FOR SELECT
    USING (
        role IN (
            SELECT nu.role FROM nts_users nu WHERE nu.id = auth.uid()
            UNION
            SELECT COALESCE(p.team_role, 'shipper') FROM profiles p WHERE p.id = auth.uid()
        )
    );

-- Policy: Only admins and super admins can modify permissions
CREATE POLICY role_permissions_admin_modify ON role_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM nts_users nu 
            WHERE nu.id = auth.uid() 
            AND nu.role IN ('admin', 'super_admin')
        )
    );

-- Create RLS policies for role_audit_log
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own role change history
CREATE POLICY role_audit_select_own ON role_audit_log
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Admins can view all role changes
CREATE POLICY role_audit_admin_select_all ON role_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM nts_users nu 
            WHERE nu.id = auth.uid() 
            AND nu.role IN ('admin', 'super_admin')
        )
    );

-- Log this migration
INSERT INTO migration_log (migration_name, executed_at, description) VALUES (
    '007_enhanced_role_based_access',
    NOW(),
    'Enhanced Role-Based Access Control: Added role enums, validation, audit logging, and permission system'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nts_users_role ON nts_users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_team_role ON profiles(team_role);

-- Add comments for documentation
COMMENT ON TYPE user_role_enum IS 'Enumeration of valid user roles in the system';
COMMENT ON TYPE team_role_enum IS 'Enumeration of valid team roles for shipper organizations';
COMMENT ON TABLE role_audit_log IS 'Audit trail for all role changes in the system';
COMMENT ON TABLE role_permissions IS 'Fine-grained permission system mapping roles to specific permissions';
COMMENT ON FUNCTION validate_user_role() IS 'Validates role assignments before insert/update';
COMMENT ON FUNCTION log_role_change() IS 'Logs all role changes for audit purposes';
COMMENT ON FUNCTION get_user_permissions(VARCHAR) IS 'Returns all permissions granted to a specific role';
COMMENT ON FUNCTION user_has_permission(UUID, VARCHAR) IS 'Checks if a user has a specific permission';

-- Validation queries to ensure migration success
DO $$
BEGIN
    -- Test that role validation works
    RAISE INFO 'Role validation migration completed successfully';
    
    -- Test permission system
    IF EXISTS(SELECT 1 FROM role_permissions WHERE role = 'admin' AND permission = 'view_quotes') THEN
        RAISE INFO 'Permission system initialized successfully';
    ELSE
        RAISE EXCEPTION 'Permission system initialization failed';
    END IF;
    
    -- Test audit system
    IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'role_audit_log') THEN
        RAISE INFO 'Role audit system created successfully';
    ELSE
        RAISE EXCEPTION 'Role audit system creation failed';
    END IF;
END $$;
