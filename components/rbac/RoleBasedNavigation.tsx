/**
 * Role-Based Navigation Components
 * Priority 5 - Enhanced RBAC System
 * 
 * Navigation components that show/hide based on user permissions
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRoleBasedAccess } from '@/lib/useRoleBasedAccess';
import { UserRole, Permission } from '@/lib/roles';
import { PermissionGate, RoleGate } from './RoleBasedComponents';

// Navigation item interface
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  permissions?: Permission[];
  roles?: UserRole[];
  requireAllPermissions?: boolean;
  children?: NavigationItem[];
}

// Role-based navigation menu component
interface RoleBasedMenuProps {
  items: NavigationItem[];
  className?: string;
  activeClassName?: string;
  linkClassName?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const RoleBasedMenu: React.FC<RoleBasedMenuProps> = ({
  items,
  className = '',
  activeClassName = 'bg-blue-100 text-blue-700',
  linkClassName = 'block px-4 py-2 text-gray-700 hover:bg-gray-100',
  orientation = 'vertical'
}) => {
  const router = useRouter();
  const { userContext } = useRoleBasedAccess();

  if (!userContext) {
    return null;
  }

  const renderItem = (item: NavigationItem) => {
    const isActive = router.pathname === item.href;
    const itemClassName = `${linkClassName} ${isActive ? activeClassName : ''}`;

    const content = (
      <Link href={item.href} className={itemClassName}>
        <span className="flex items-center space-x-2">
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </span>
      </Link>
    );

    // Check permissions and roles
    if (item.permissions && item.permissions.length > 0) {
      return (
        <PermissionGate
          key={item.href}
          permissions={item.permissions}
          requireAll={item.requireAllPermissions}
        >
          {content}
        </PermissionGate>
      );
    }

    if (item.roles && item.roles.length > 0) {
      return (
        <RoleGate key={item.href} roles={item.roles}>
          {content}
        </RoleGate>
      );
    }

    return <div key={item.href}>{content}</div>;
  };

  const menuClassName = `${className} ${
    orientation === 'horizontal' ? 'flex space-x-4' : 'space-y-1'
  }`;

  return (
    <nav className={menuClassName}>
      {items.map(renderItem)}
    </nav>
  );
};

// Quick action buttons based on role
interface QuickActionsProps {
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ className = '' }) => {
  const { userContext, hasPermission } = useRoleBasedAccess();

  if (!userContext) {
    return null;
  }

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Create Quote - Available to shippers and sales reps */}
      <PermissionGate permission={Permission.CREATE_QUOTES}>
        <Link
          href="/quotes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Quote
        </Link>
      </PermissionGate>

      {/* View Reports - Admin and managers only */}
      <PermissionGate permission={Permission.VIEW_REPORTS}>
        <Link
          href="/reports"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          View Reports
        </Link>
      </PermissionGate>

      {/* Company Management - Admin only */}
      <PermissionGate permission={Permission.EDIT_COMPANIES}>
        <Link
          href="/admin/companies"
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
        >
          Manage Companies
        </Link>
      </PermissionGate>

      {/* User Management - Admin and super admin only */}
      <PermissionGate permission={Permission.MANAGE_ROLES}>
        <Link
          href="/admin/users"
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Manage Users
        </Link>
      </PermissionGate>
    </div>
  );
};

// Role-based dashboard shortcuts
export const DashboardShortcuts: React.FC = () => {
  const { userContext } = useRoleBasedAccess();

  if (!userContext) {
    return null;
  }

  const getShortcuts = () => {
    switch (userContext.role) {
      case UserRole.SHIPPER:
        return [
          { label: 'Request Quote', href: '/quotes/new', icon: '📋' },
          { label: 'My Orders', href: '/orders', icon: '📦' },
          { label: 'Profile Settings', href: '/profile', icon: '⚙️' }
        ];

      case UserRole.SALES_REP:
        return [
          { label: 'Active Quotes', href: '/quotes', icon: '💼' },
          { label: 'My Companies', href: '/companies', icon: '🏢' },
          { label: 'Customer Support', href: '/support', icon: '🎧' }
        ];

      case UserRole.MANAGER:
        return [
          { label: 'Team Dashboard', href: '/dashboard/team', icon: '👥' },
          { label: 'Performance Reports', href: '/reports/performance', icon: '📊' },
          { label: 'Company Assignments', href: '/assignments', icon: '🔗' }
        ];

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return [
          { label: 'System Overview', href: '/admin/overview', icon: '🖥️' },
          { label: 'User Management', href: '/admin/users', icon: '👤' },
          { label: 'System Settings', href: '/admin/settings', icon: '⚙️' },
          { label: 'Audit Logs', href: '/admin/audit', icon: '📜' }
        ];

      default:
        return [];
    }
  };

  const shortcuts = getShortcuts();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {shortcuts.map((shortcut) => (
        <Link
          key={shortcut.href}
          href={shortcut.href}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">{shortcut.icon}</div>
            <div className="text-sm font-medium text-gray-700">{shortcut.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
};

// Role badge component for displaying user role
interface RoleBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  className = '', 
  showIcon = true 
}) => {
  const { userContext } = useRoleBasedAccess();

  if (!userContext) {
    return null;
  }

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.SHIPPER:
        return { 
          label: 'Shipper', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🚚'
        };
      case UserRole.SALES_REP:
        return { 
          label: 'Sales Rep', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '💼'
        };
      case UserRole.MANAGER:
        return { 
          label: 'Manager', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '👨‍💼'
        };
      case UserRole.ADMIN:
        return { 
          label: 'Admin', 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: '👑'
        };
      case UserRole.SUPER_ADMIN:
        return { 
          label: 'Super Admin', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '⚡'
        };
      case UserRole.SUPPORT:
        return { 
          label: 'Support', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '🎧'
        };
      default:
        return { 
          label: 'User', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '👤'
        };
    }
  };

  const config = getRoleConfig(userContext.role);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
};

// Navigation breadcrumbs with role-based visibility
interface BreadcrumbItem {
  label: string;
  href?: string;
  permissions?: Permission[];
  roles?: UserRole[];
}

interface RoleBasedBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const RoleBasedBreadcrumbs: React.FC<RoleBasedBreadcrumbsProps> = ({
  items,
  className = ''
}) => {
  const renderItem = (item: BreadcrumbItem, index: number, array: BreadcrumbItem[]) => {
    const isLast = index === array.length - 1;
    
    const content = (
      <span key={index} className="flex items-center">
        {item.href && !isLast ? (
          <Link href={item.href} className="text-blue-600 hover:text-blue-800">
            {item.label}
          </Link>
        ) : (
          <span className={isLast ? 'text-gray-900' : 'text-gray-500'}>
            {item.label}
          </span>
        )}
        {!isLast && <span className="mx-2 text-gray-400">/</span>}
      </span>
    );

    // Check permissions and roles
    if (item.permissions && item.permissions.length > 0) {
      return (
        <PermissionGate key={index} permissions={item.permissions}>
          {content}
        </PermissionGate>
      );
    }

    if (item.roles && item.roles.length > 0) {
      return (
        <RoleGate key={index} roles={item.roles}>
          {content}
        </RoleGate>
      );
    }

    return content;
  };

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-0">
        {items.map(renderItem)}
      </ol>
    </nav>
  );
};
