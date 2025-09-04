/**
 * Role Migration Utility
 * Handles transition from legacy roles to enhanced RBAC roles
 * Priority 5 - Enhanced RBAC System
 */

import { UserRole } from './roles';

// Legacy role mapping
const STRING_TO_ROLE_MAP: Record<string, UserRole> = {
  'shipper': UserRole.SHIPPER,
  'sales': UserRole.SALES_REP,
  'sales_rep': UserRole.SALES_REP,
  'broker': UserRole.SALES_REP, // Legacy broker maps to sales rep
  'admin': UserRole.ADMIN,
  'administrator': UserRole.ADMIN,
  'super_admin': UserRole.SUPER_ADMIN,
  'superadmin': UserRole.SUPER_ADMIN,
  'support': UserRole.SUPPORT,
  'customer_support': UserRole.SUPPORT
};

// Reverse mapping for database storage
export const RBAC_TO_DB_ROLE: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'super_admin',
  [UserRole.ADMIN]: 'admin',
  [UserRole.SALES_REP]: 'sales',
  [UserRole.SHIPPER]: 'shipper',
  [UserRole.SUPPORT]: 'support'
};

/**
 * Convert legacy role to enhanced RBAC role
 */
export const normalizeLegacyRole = (legacyRole: string): UserRole => {
  const normalizedInput = legacyRole.toLowerCase().trim();
  
  // Direct mapping
  if (STRING_TO_ROLE_MAP[normalizedInput]) {
    return STRING_TO_ROLE_MAP[normalizedInput];
  }
  
  // Fuzzy matching for common variations
  if (normalizedInput.includes('super') && normalizedInput.includes('admin')) {
    return UserRole.SUPER_ADMIN;
  }
  
  if (normalizedInput.includes('admin')) {
    return UserRole.ADMIN;
  }
  
  if (normalizedInput.includes('manager') || normalizedInput.includes('mgr')) {
    return UserRole.SALES_REP; // Map manager to sales rep since we removed manager role
  }
  
  if (normalizedInput.includes('sales') || normalizedInput.includes('broker')) {
    return UserRole.SALES_REP;
  }
  
  if (normalizedInput.includes('support') || normalizedInput.includes('help')) {
    return UserRole.SUPPORT;
  }
  
  if (normalizedInput.includes('shipper') || normalizedInput.includes('customer')) {
    return UserRole.SHIPPER;
  }
  
  // Default fallback
  console.warn(`Unknown role: ${legacyRole}, defaulting to SALES_REP`);
  return UserRole.SALES_REP;
};

/**
 * Convert RBAC role to database-compatible role string
 */
export const roleToDbString = (role: UserRole): string => {
  return RBAC_TO_DB_ROLE[role] || 'sales';
};

/**
 * Validate if a role transition is allowed
 */
export const isValidRoleTransition = (
  currentRole: UserRole, 
  newRole: UserRole,
  requestorRole: UserRole
): { valid: boolean; reason?: string } => {
  // Super admins can change anyone to anything
  if (requestorRole === UserRole.SUPER_ADMIN) {
    return { valid: true };
  }
  
  // Admins cannot promote someone to super admin
  if (requestorRole === UserRole.ADMIN && newRole === UserRole.SUPER_ADMIN) {
    return { 
      valid: false, 
      reason: 'Only super admins can assign super admin role' 
    };
  }
  
  // Admins can manage other roles
  if (requestorRole === UserRole.ADMIN) {
    return { valid: true };
  }
  
  // Regular users cannot change roles
  return { 
    valid: false, 
    reason: 'Insufficient permissions to change roles' 
  };
};

/**
 * Get user-friendly role descriptions
 */
export const getRoleDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Full system access, can manage everything including other admins',
    [UserRole.ADMIN]: 'Administrative access, can manage users, companies, and system settings',
    [UserRole.SALES_REP]: 'Sales representative access, can manage assigned companies and quotes',
    [UserRole.SHIPPER]: 'Shipper access, can create quotes and manage their company profile',
    [UserRole.SUPPORT]: 'Support team access, can view data and handle support tickets'
  };
  
  return descriptions[role] || 'Unknown role';
};

/**
 * Check if role has elevated admin privileges
 */
export const hasAdminPrivileges = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);
};

/**
 * Check if role can manage other users
 */
export const canManageUsers = (role: UserRole): boolean => {
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);
};

/**
 * Get roles that a user can assign to others
 */
export const getAssignableRoles = (requestorRole: UserRole): UserRole[] => {
  switch (requestorRole) {
    case UserRole.SUPER_ADMIN:
      return Object.values(UserRole);
      
    case UserRole.ADMIN:
      return [
        UserRole.ADMIN,
        UserRole.SALES_REP,
        UserRole.SHIPPER,
        UserRole.SUPPORT
      ];
      
    default:
      return [];
  }
};

/**
 * Migration function to update legacy roles in database
 * This can be run as a one-time migration script
 */
export const migrateLegacyRoles = async (supabase: any) => {
  console.log('🔄 Starting legacy role migration...');
  
  try {
    // Migrate nts_users table
    const { data: ntsUsers, error: ntsError } = await supabase
      .from('nts_users')
      .select('id, email, role');
      
    if (ntsError) {
      console.error('Error fetching nts_users:', ntsError);
      return;
    }
    
    const ntsUpdates = ntsUsers
      .filter((user: any) => user.role === 'superadmin') // Only migrate old superadmin
      .map((user: any) => ({
        id: user.id,
        role: 'super_admin' // Convert to new format
      }));
    
    if (ntsUpdates.length > 0) {
      console.log(`📊 Migrating ${ntsUpdates.length} nts_users with legacy roles...`);
      
      for (const update of ntsUpdates) {
        const { error: updateError } = await supabase
          .from('nts_users')
          .update({ role: update.role })
          .eq('id', update.id);
          
        if (updateError) {
          console.error(`❌ Failed to update user ${update.id}:`, updateError);
        } else {
          console.log(`✅ Updated user ${update.id}: superadmin → super_admin`);
        }
      }
    }
    
    console.log('✅ Legacy role migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Legacy role migration failed:', error);
  }
};

/**
 * Utility to safely get role display name with fallback
 */
export const safeGetRoleDisplayName = (role: string | UserRole): string => {
  try {
    if (typeof role === 'string') {
      const normalizedRole = normalizeLegacyRole(role);
      return getRoleDisplayName(normalizedRole);
    }
    return getRoleDisplayName(role as UserRole);
  } catch (error) {
    console.warn(`Failed to get display name for role: ${role}`);
    return role.toString();
  }
};

// Import from roles.ts to avoid circular dependency
function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SHIPPER]: 'Shipper',
    [UserRole.SALES_REP]: 'Sales Representative', 
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
    [UserRole.SUPPORT]: 'Support'
  };
  
  return displayNames[role];
}
