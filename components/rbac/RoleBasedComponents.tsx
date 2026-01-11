/**
 * Role-Based Access Control React Components
 * Priority 5 - Enhanced RBAC System
 * 
 * Provides declarative components for role-based UI rendering
 */

import React from 'react';
import { useRoleBasedAccess, usePermissionGate, useRoleGate } from '@/lib/useRoleBasedAccess';
import { UserRole, Permission } from '@/lib/roles';

// Permission Gate Component
interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null,
  children 
}) => {
  const Gate = usePermissionGate();
  
  const permissionList = permissions || (permission ? [permission] : []);
  
  return (
    <Gate 
      permissions={permissionList} 
      requireAll={requireAll}
      fallback={fallback}
    >
      {children}
    </Gate>
  );
};

// Role Gate Component
interface RoleGateProps {
  role?: UserRole;
  roles?: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ 
  role, 
  roles, 
  fallback = null,
  children 
}) => {
  const Gate = useRoleGate();
  
  const roleList = roles || (role ? [role] : []);
  
  return (
    <Gate 
      roles={roleList} 
      fallback={fallback}
    >
      {children}
    </Gate>
  );
};

// Admin Only Component
interface AdminOnlyProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  includeSuperAdmin?: boolean;
  includeManager?: boolean;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ 
  fallback = null, 
  children,
  includeSuperAdmin = true,
  includeManager = false
}) => {
  let roles = [UserRole.ADMIN];
  
  if (includeSuperAdmin) {
    roles.push(UserRole.SUPER_ADMIN);
  }
  

  return (
    <RoleGate roles={roles} fallback={fallback}>
      {children}
    </RoleGate>
  );
};

// Shipper Only Component
interface ShipperOnlyProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ShipperOnly: React.FC<ShipperOnlyProps> = ({ 
  fallback = null, 
  children 
}) => {
  return (
    <RoleGate role={UserRole.SHIPPER} fallback={fallback}>
      {children}
    </RoleGate>
  );
};

// Sales Rep Only Component  
interface SalesRepOnlyProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  includeManager?: boolean;
}



// Loading Boundary - shows loading state while roles are being fetched
interface LoadingBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  fallback = <div className="animate-pulse">Loading...</div>,
  children
}) => {
  const { loading } = useRoleBasedAccess();
  
  if (loading) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Error Boundary for role-based access errors
interface RoleErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleErrorBoundary: React.FC<RoleErrorBoundaryProps> = ({
  fallback = <div className="text-red-500">Access error occurred</div>,
  children
}) => {
  const { error } = useRoleBasedAccess();
  
  if (error) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Higher Order Component for role-based access
export const withRoleAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles: UserRole | UserRole[],
  FallbackComponent?: React.ComponentType<P>
) => {
  const WithRoleAccessComponent: React.FC<P> = (props) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return (
      <RoleGate 
        roles={roles}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : <div>Unauthorized</div>}
      >
        <WrappedComponent {...props} />
      </RoleGate>
    );
  };
  
  WithRoleAccessComponent.displayName = `withRoleAccess(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithRoleAccessComponent;
};

// Higher Order Component for permission-based access
export const withPermissionAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: Permission | Permission[],
  requireAll: boolean = false,
  FallbackComponent?: React.ComponentType<P>
) => {
  const WithPermissionAccessComponent: React.FC<P> = (props) => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return (
      <PermissionGate 
        permissions={permissions}
        requireAll={requireAll}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : <div>Insufficient permissions</div>}
      >
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
  
  WithPermissionAccessComponent.displayName = `withPermissionAccess(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPermissionAccessComponent;
};

// Unauthorized Component - standard fallback for access denied
export const Unauthorized: React.FC<{ message?: string }> = ({ 
  message = "You don't have permission to access this content." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-50">
      <div className="text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
};

// Loading Component - standard loading state
export const Loading: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
};
