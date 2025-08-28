/**
 * Enhanced Role-Based Access Control System
 * Priority 5 - NTS Client Connect Portal
 * 
 * This module provides a unified role-based access control system
 * replacing the inconsistent role checking throughout the application.
 */

import { Database } from './database.types';

// Type definitions from database
type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
type NtsUsersRow = Database['public']['Tables']['nts_users']['Row'];

// Unified Role Enum - replaces inconsistent string checking
export enum UserRole {
  SHIPPER = 'shipper',
  SALES_REP = 'sales',
  ADMIN = 'admin', 
  SUPER_ADMIN = 'super_admin',
  MANAGER = 'manager',
  SUPPORT = 'support'
}

// Permission categories for fine-grained access control
export enum Permission {
  // Quote Management
  VIEW_QUOTES = 'view_quotes',
  CREATE_QUOTES = 'create_quotes',
  EDIT_QUOTES = 'edit_quotes',
  DELETE_QUOTES = 'delete_quotes',
  APPROVE_QUOTES = 'approve_quotes',
  
  // Order Management  
  VIEW_ORDERS = 'view_orders',
  CREATE_ORDERS = 'create_orders',
  EDIT_ORDERS = 'edit_orders',
  DELETE_ORDERS = 'delete_orders',
  FULFILL_ORDERS = 'fulfill_orders',
  
  // Company Management
  VIEW_COMPANIES = 'view_companies',
  CREATE_COMPANIES = 'create_companies', 
  EDIT_COMPANIES = 'edit_companies',
  DELETE_COMPANIES = 'delete_companies',
  ASSIGN_SALES_USERS = 'assign_sales_users',
  
  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users', 
  DELETE_USERS = 'delete_users',
  MANAGE_ROLES = 'manage_roles',
  
  // Reports & Analytics
  VIEW_REPORTS = 'view_reports',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // System Administration
  SYSTEM_CONFIG = 'system_config',
  DATABASE_ACCESS = 'database_access',
  API_ACCESS = 'api_access',
  
  // Support & Chat
  VIEW_CHAT = 'view_chat',
  SUPPORT_TICKETS = 'support_tickets'
}

// Role-Permission mapping - defines what each role can do
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SHIPPER]: [
    Permission.VIEW_QUOTES,
    Permission.CREATE_QUOTES,
    Permission.EDIT_QUOTES,
    Permission.VIEW_ORDERS,
    Permission.APPROVE_QUOTES,
    Permission.VIEW_CHAT
  ],
  
  [UserRole.SALES_REP]: [
    Permission.VIEW_QUOTES,
    Permission.CREATE_QUOTES,
    Permission.EDIT_QUOTES,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.FULFILL_ORDERS,
    Permission.VIEW_COMPANIES,
    Permission.VIEW_USERS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_CHAT,
    Permission.SUPPORT_TICKETS
  ],
  
  [UserRole.MANAGER]: [
    Permission.VIEW_QUOTES,
    Permission.CREATE_QUOTES,
    Permission.EDIT_QUOTES,
    Permission.DELETE_QUOTES,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.DELETE_ORDERS,
    Permission.FULFILL_ORDERS,
    Permission.VIEW_COMPANIES,
    Permission.EDIT_COMPANIES,
    Permission.ASSIGN_SALES_USERS,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_CHAT,
    Permission.SUPPORT_TICKETS
  ],
  
  [UserRole.ADMIN]: [
    Permission.VIEW_QUOTES,
    Permission.CREATE_QUOTES,
    Permission.EDIT_QUOTES,
    Permission.DELETE_QUOTES,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.DELETE_ORDERS,
    Permission.FULFILL_ORDERS,
    Permission.VIEW_COMPANIES,
    Permission.CREATE_COMPANIES,
    Permission.EDIT_COMPANIES,
    Permission.DELETE_COMPANIES,
    Permission.ASSIGN_SALES_USERS,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_CHAT,
    Permission.SUPPORT_TICKETS,
    Permission.API_ACCESS
  ],
  
  [UserRole.SUPER_ADMIN]: [
    // Super admin gets all permissions
    ...Object.values(Permission)
  ],
  
  [UserRole.SUPPORT]: [
    Permission.VIEW_QUOTES,
    Permission.VIEW_ORDERS,
    Permission.VIEW_COMPANIES,
    Permission.VIEW_USERS,
    Permission.VIEW_CHAT,
    Permission.SUPPORT_TICKETS
  ]
};

// User context interface - unified user information
export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  companyId: string | null;
  userType: 'shipper' | 'nts_user';
  permissions: Permission[];
  profileComplete?: boolean;
  teamRole?: string | null;
}

/**
 * Normalize user data from either profiles or nts_users table
 * into unified UserContext interface
 */
export const createUserContext = (
  user: ProfilesRow | NtsUsersRow, 
  userType: 'shipper' | 'nts_user'
): UserContext => {
  // Determine role based on user type and existing role field
  let role: UserRole;
  
  if (userType === 'shipper') {
    const profile = user as ProfilesRow;
    // Shippers can be managers within their company
    role = profile.team_role === 'manager' ? UserRole.MANAGER : UserRole.SHIPPER;
  } else {
    const ntsUser = user as NtsUsersRow;
    // Map nts_users role string to UserRole enum with legacy support
    switch (ntsUser.role) {
      case 'sales':
      case 'sales_rep':
      case 'broker': // Legacy broker role
        role = UserRole.SALES_REP;
        break;
      case 'admin':
      case 'administrator':
        role = UserRole.ADMIN;
        break;
      case 'super_admin':
      case 'superadmin': // Legacy format
        role = UserRole.SUPER_ADMIN;
        break;
      case 'manager':
        role = UserRole.MANAGER;
        break;
      case 'support':
      case 'customer_support':
        role = UserRole.SUPPORT;
        break;
      case 'shipper':
        role = UserRole.SHIPPER;
        break;
      default:
        console.warn(`Unknown role in nts_users: ${ntsUser.role}, defaulting to SALES_REP`);
        role = UserRole.SALES_REP; // Default fallback
    }
  }
  
  return {
    id: user.id,
    email: user.email,
    role,
    firstName: user.first_name,
    lastName: user.last_name,
    companyId: user.company_id,
    userType,
    permissions: ROLE_PERMISSIONS[role],
    profileComplete: userType === 'shipper' ? (user as ProfilesRow).profile_complete : undefined,
    teamRole: userType === 'shipper' ? (user as ProfilesRow).team_role : undefined
  };
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  userContext: UserContext, 
  permission: Permission
): boolean => {
  return userContext.permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions (OR logic)
 */
export const hasAnyPermission = (
  userContext: UserContext, 
  permissions: Permission[]
): boolean => {
  return permissions.some(permission => userContext.permissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions (AND logic)  
 */
export const hasAllPermissions = (
  userContext: UserContext, 
  permissions: Permission[]
): boolean => {
  return permissions.every(permission => userContext.permissions.includes(permission));
};

/**
 * Check if user can access company data
 * - Shippers can only access their own company
 * - Sales reps can access assigned companies  
 * - Admins can access all companies
 */
export const canAccessCompany = (
  userContext: UserContext,
  companyId: string,
  assignedCompanyIds?: string[]
): boolean => {
  // Super admins can access everything
  if (userContext.role === UserRole.SUPER_ADMIN || userContext.role === UserRole.ADMIN) {
    return true;
  }
  
  // Shippers can only access their own company
  if (userContext.userType === 'shipper') {
    return userContext.companyId === companyId;
  }
  
  // Sales reps can access assigned companies
  if (userContext.role === UserRole.SALES_REP || userContext.role === UserRole.MANAGER) {
    if (!assignedCompanyIds) {
      // If assigned companies not provided, fall back to their company_id
      return userContext.companyId === companyId;
    }
    return assignedCompanyIds.includes(companyId);
  }
  
  return false;
};

/**
 * Get user's accessible company IDs based on role
 * This replaces the scattered company_id fetching logic
 */
export const getAccessibleCompanyIds = (
  userContext: UserContext,
  assignedCompanyIds?: string[]
): string[] => {
  // Super admins and admins can access all companies (return empty array = all)
  if (userContext.role === UserRole.SUPER_ADMIN || userContext.role === UserRole.ADMIN) {
    return []; // Empty array means "all companies" in query context
  }
  
  // Shippers can only access their own company
  if (userContext.userType === 'shipper' && userContext.companyId) {
    return [userContext.companyId];
  }
  
  // Sales reps and managers access assigned companies
  if ((userContext.role === UserRole.SALES_REP || userContext.role === UserRole.MANAGER) && assignedCompanyIds) {
    return assignedCompanyIds;
  }
  
  // Fallback to user's own company
  return userContext.companyId ? [userContext.companyId] : [];
};

/**
 * Validate role assignment - ensures valid role transitions
 */
export const canAssignRole = (
  assignerRole: UserRole,
  targetRole: UserRole
): boolean => {
  // Only super admins can assign super admin role
  if (targetRole === UserRole.SUPER_ADMIN) {
    return assignerRole === UserRole.SUPER_ADMIN;
  }
  
  // Only admins and super admins can assign admin role
  if (targetRole === UserRole.ADMIN) {
    return assignerRole === UserRole.ADMIN || assignerRole === UserRole.SUPER_ADMIN;
  }
  
  // Admins and super admins can assign any other role
  if (assignerRole === UserRole.ADMIN || assignerRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Managers can assign sales rep and support roles
  if (assignerRole === UserRole.MANAGER) {
    return targetRole === UserRole.SALES_REP || targetRole === UserRole.SUPPORT || targetRole === UserRole.SHIPPER;
  }
  
  return false;
};

/**
 * Get display name for role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SHIPPER]: 'Shipper',
    [UserRole.SALES_REP]: 'Sales Representative', 
    [UserRole.MANAGER]: 'Manager',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
    [UserRole.SUPPORT]: 'Support'
  };
  
  return displayNames[role];
};

/**
 * Check if role has elevated privileges (admin-level)
 */
export const isElevatedRole = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER].includes(role);
};
