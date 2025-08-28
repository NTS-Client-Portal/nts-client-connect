/**
 * React Hooks for Role-Based Access Control
 * Priority 5 - Enhanced RBAC System
 * 
 * These hooks provide easy-to-use role checking functionality
 * for React components, replacing scattered permission logic.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from './initSupabase';
import { 
  UserContext, 
  UserRole, 
  Permission, 
  createUserContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessCompany,
  getAccessibleCompanyIds 
} from './roles';
import { normalizeLegacyRole } from './roleUtils';
import { Database } from './database.types';

type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
type NtsUsersRow = Database['public']['Tables']['nts_users']['Row'];

// Hook state interface
interface UseRoleState {
  userContext: UserContext | null;
  loading: boolean;
  error: string | null;
  assignedCompanyIds: string[];
}

/**
 * Main hook for role-based access control
 * Replaces the scattered useProfilesUser and useNtsUsers context usage
 */
export const useRoleBasedAccess = (): UseRoleState & {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  getAccessibleCompanyIds: () => string[];
  isAdmin: boolean;
  isShipper: boolean;
  isSalesRep: boolean;
  isManager: boolean;
  refresh: () => Promise<void>;
} => {
  const session = useSession();
  const [state, setState] = useState<UseRoleState>({
    userContext: null,
    loading: true,
    error: null,
    assignedCompanyIds: []
  });

  // Memoized helper functions
  const helpers = useMemo(() => {
    if (!state.userContext) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
        canAccessCompany: () => false,
        getAccessibleCompanyIds: () => [],
        isAdmin: false,
        isShipper: false,
        isSalesRep: false,
        isManager: false
      };
    }

    return {
      hasPermission: (permission: Permission) => hasPermission(state.userContext!, permission),
      hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(state.userContext!, permissions),
      hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(state.userContext!, permissions),
      canAccessCompany: (companyId: string) => canAccessCompany(state.userContext!, companyId, state.assignedCompanyIds),
      getAccessibleCompanyIds: () => getAccessibleCompanyIds(state.userContext!, state.assignedCompanyIds),
      isAdmin: [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(state.userContext!.role),
      isShipper: state.userContext!.role === UserRole.SHIPPER,
      isSalesRep: state.userContext!.role === UserRole.SALES_REP,
      isManager: state.userContext!.role === UserRole.MANAGER
    };
  }, [state.userContext, state.assignedCompanyIds]);

  // Fetch user context and assigned companies
  const fetchUserContext = async (): Promise<void> => {
    if (!session?.user?.id) {
      setState(prev => ({ 
        ...prev, 
        userContext: null, 
        loading: false, 
        assignedCompanyIds: [] 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First, try to fetch from profiles table (shipper)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData && !profileError) {
        // User is a shipper
        const userContext = createUserContext(profileData, 'shipper');
        
        setState({
          userContext,
          loading: false,
          error: null,
          assignedCompanyIds: userContext.companyId ? [userContext.companyId] : []
        });
        return;
      }

      // If not found in profiles, try nts_users table
      const { data: ntsUserData, error: ntsUserError } = await supabase
        .from('nts_users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (ntsUserData && !ntsUserError) {
        // User is an NTS user (sales rep, admin, etc.)
        const userContext = createUserContext(ntsUserData, 'nts_user');
        
        // Fetch assigned company IDs for sales reps and managers
        let assignedCompanyIds: string[] = [];
        
        if (userContext.role === UserRole.SALES_REP || userContext.role === UserRole.MANAGER) {
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .eq('sales_user_id', session.user.id);

          if (assignmentData && !assignmentError) {
            assignedCompanyIds = assignmentData.map(assignment => assignment.company_id);
          } else {
            console.warn('Error fetching assigned companies:', assignmentError?.message);
          }
        }

        setState({
          userContext,
          loading: false,
          error: null,
          assignedCompanyIds
        });
        return;
      }

      // User not found in either table
      setState({
        userContext: null,
        loading: false,
        error: 'User not found in profiles or nts_users tables',
        assignedCompanyIds: []
      });

    } catch (error) {
      console.error('Error fetching user context:', error);
      setState({
        userContext: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        assignedCompanyIds: []
      });
    }
  };

  // Fetch on session change
  useEffect(() => {
    fetchUserContext();
  }, [session?.user?.id]);

  return {
    ...state,
    ...helpers,
    refresh: fetchUserContext
  };
};

/**
 * Hook for permission-based component rendering
 * Usage: const PermissionGate = usePermissionGate();
 */
export const usePermissionGate = () => {
  const { userContext } = useRoleBasedAccess();

  return useMemo(() => {
    return ({ 
      permissions, 
      fallback = null, 
      children,
      requireAll = false 
    }: {
      permissions: Permission | Permission[];
      fallback?: React.ReactNode;
      children: React.ReactNode;
      requireAll?: boolean;
    }) => {
      if (!userContext) {
        return fallback;
      }

      const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
      const hasAccess = requireAll 
        ? hasAllPermissions(userContext, permissionArray)
        : hasAnyPermission(userContext, permissionArray);

      return hasAccess ? children : fallback;
    };
  }, [userContext]);
};

/**
 * Hook for role-based component rendering  
 * Usage: const RoleGate = useRoleGate();
 */
export const useRoleGate = () => {
  const { userContext } = useRoleBasedAccess();

  return useMemo(() => {
    return ({
      roles,
      fallback = null,
      children
    }: {
      roles: UserRole | UserRole[];
      fallback?: React.ReactNode;
      children: React.ReactNode;
    }) => {
      if (!userContext) {
        return fallback;
      }

      const roleArray = Array.isArray(roles) ? roles : [roles];
      const hasAccess = roleArray.includes(userContext.role);

      return hasAccess ? children : fallback;
    };
  }, [userContext]);
};

/**
 * Simplified hook for specific role checks
 * Provides boolean flags for common role checks
 */
export const useRoleFlags = () => {
  const { userContext } = useRoleBasedAccess();

  return useMemo(() => {
    if (!userContext) {
      return {
        isShipper: false,
        isSalesRep: false,
        isManager: false,
        isAdmin: false,
        isSuperAdmin: false,
        isSupport: false,
        isElevated: false,
        userType: null as 'shipper' | 'nts_user' | null
      };
    }

    return {
      isShipper: userContext.role === UserRole.SHIPPER,
      isSalesRep: userContext.role === UserRole.SALES_REP,
      isManager: userContext.role === UserRole.MANAGER,
      isAdmin: userContext.role === UserRole.ADMIN,
      isSuperAdmin: userContext.role === UserRole.SUPER_ADMIN,
      isSupport: userContext.role === UserRole.SUPPORT,
      isElevated: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER].includes(userContext.role),
      userType: userContext.userType
    };
  }, [userContext]);
};

/**
 * Hook for company access checks
 * Useful for data fetching and UI rendering based on company access
 */
export const useCompanyAccess = () => {
  const { userContext, assignedCompanyIds } = useRoleBasedAccess();

  return useMemo(() => {
    return {
      canAccessCompany: (companyId: string) => 
        userContext ? canAccessCompany(userContext, companyId, assignedCompanyIds) : false,
      
      getAccessibleCompanyIds: () =>
        userContext ? getAccessibleCompanyIds(userContext, assignedCompanyIds) : [],
      
      assignedCompanyIds,
      
      hasUniversalAccess: () => 
        userContext ? [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userContext.role) : false
    };
  }, [userContext, assignedCompanyIds]);
};

/**
 * Legacy compatibility hook
 * Provides the old interface while using new RBAC system under the hood
 * This allows gradual migration of existing components
 */
export const useLegacyUserType = () => {
  const { userContext, loading } = useRoleBasedAccess();

  return useMemo(() => {
    if (loading || !userContext) {
      return {
        userType: null,
        isUser: false, // Legacy: isUser meant isShipper
        userProfile: null,
        loading
      };
    }

    return {
      userType: userContext.userType === 'shipper' ? 'shipper' : 'broker',
      isUser: userContext.userType === 'shipper',
      userProfile: userContext,
      loading: false
    };
  }, [userContext, loading]);
};
