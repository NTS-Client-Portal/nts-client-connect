/**
 * RBAC System Test Component
 * Priority 5 - Enhanced RBAC Testing
 * 
 * Tests the role-based access control system with current data
 */

import React from 'react';
import { useRoleBasedAccess } from '@/lib/useRoleBasedAccess';
import { Permission, UserRole } from '@/lib/roles';
import { 
  PermissionGate, 
  RoleGate, 
  AdminOnly, 
  ShipperOnly, 
  SalesRepOnly,
  Loading,
  Unauthorized
} from '@/components/rbac/RoleBasedComponents';
import { RoleBadge } from '@/components/rbac/RoleBasedNavigation';

const RBACTestPage: React.FC = () => {
  const {
    userContext,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    canAccessCompany,
    getAccessibleCompanyIds,
    isAdmin,
    isShipper,
    isSalesRep,
    isManager,
    refresh
  } = useRoleBasedAccess();

  if (loading) {
    return <Loading message="Loading RBAC test..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">RBAC Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={refresh}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!userContext) {
    return <Unauthorized message="Please log in to test RBAC system" />;
  }

  const testCompanyId = userContext.companyId || 'test-company-id';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          RBAC System Test Dashboard
        </h1>
        <p className="text-gray-600">
          Testing Enhanced Role-Based Access Control - Priority 5
        </p>
      </div>

      {/* User Context Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          User Context
          <RoleBadge />
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Basic Info</h3>
            <div className="space-y-1 text-sm">
              <p><strong>ID:</strong> {userContext.id}</p>
              <p><strong>Email:</strong> {userContext.email}</p>
              <p><strong>Name:</strong> {userContext.firstName} {userContext.lastName}</p>
              <p><strong>Role:</strong> {userContext.role}</p>
              <p><strong>User Type:</strong> {userContext.userType}</p>
              <p><strong>Company ID:</strong> {userContext.companyId || 'None'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Role Flags</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Is Shipper:</strong> {isShipper ? '✅' : '❌'}</p>
              <p><strong>Is Sales Rep:</strong> {isSalesRep ? '✅' : '❌'}</p>
              <p><strong>Is Manager:</strong> {isManager ? '✅' : '❌'}</p>
              <p><strong>Is Admin:</strong> {isAdmin ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Testing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Permission Testing</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Quote Permissions</h3>
            <div className="space-y-1 text-sm">
              <p>View Quotes: {hasPermission(Permission.VIEW_QUOTES) ? '✅' : '❌'}</p>
              <p>Create Quotes: {hasPermission(Permission.CREATE_QUOTES) ? '✅' : '❌'}</p>
              <p>Edit Quotes: {hasPermission(Permission.EDIT_QUOTES) ? '✅' : '❌'}</p>
              <p>Delete Quotes: {hasPermission(Permission.DELETE_QUOTES) ? '✅' : '❌'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Company Permissions</h3>
            <div className="space-y-1 text-sm">
              <p>View Companies: {hasPermission(Permission.VIEW_COMPANIES) ? '✅' : '❌'}</p>
              <p>Edit Companies: {hasPermission(Permission.EDIT_COMPANIES) ? '✅' : '❌'}</p>
              <p>Assign Sales Users: {hasPermission(Permission.ASSIGN_SALES_USERS) ? '✅' : '❌'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Admin Permissions</h3>
            <div className="space-y-1 text-sm">
              <p>Manage Roles: {hasPermission(Permission.MANAGE_ROLES) ? '✅' : '❌'}</p>
              <p>System Config: {hasPermission(Permission.SYSTEM_CONFIG) ? '✅' : '❌'}</p>
              <p>Database Access: {hasPermission(Permission.DATABASE_ACCESS) ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Access Testing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Company Access Testing</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Access Test</h3>
            <p className="text-sm">
              Can access company "{testCompanyId}": {canAccessCompany(testCompanyId) ? '✅' : '❌'}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Accessible Company IDs</h3>
            <div className="text-sm">
              {getAccessibleCompanyIds().length > 0 ? (
                <ul className="list-disc list-inside">
                  {getAccessibleCompanyIds().map(id => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">All companies (admin access)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Component Rendering */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Component Rendering Tests</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Permission Gates</h3>
            
            <div className="space-y-3">
              <PermissionGate 
                permission={Permission.VIEW_QUOTES}
                fallback={<p className="text-red-500 text-sm">❌ Cannot view quotes</p>}
              >
                <p className="text-green-600 text-sm">✅ Can view quotes</p>
              </PermissionGate>
              
              <PermissionGate 
                permission={Permission.CREATE_COMPANIES}
                fallback={<p className="text-red-500 text-sm">❌ Cannot create companies</p>}
              >
                <p className="text-green-600 text-sm">✅ Can create companies</p>
              </PermissionGate>
              
              <PermissionGate 
                permission={Permission.MANAGE_ROLES}
                fallback={<p className="text-red-500 text-sm">❌ Cannot manage roles</p>}
              >
                <p className="text-green-600 text-sm">✅ Can manage roles</p>
              </PermissionGate>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Role Gates</h3>
            
            <div className="space-y-3">
              <ShipperOnly fallback={<p className="text-gray-500 text-sm">Not a shipper</p>}>
                <p className="text-blue-600 text-sm">✅ Shipper content visible</p>
              </ShipperOnly>
              
              <SalesRepOnly fallback={<p className="text-gray-500 text-sm">Not a sales rep</p>}>
                <p className="text-green-600 text-sm">✅ Sales rep content visible</p>
              </SalesRepOnly>
              
              <AdminOnly fallback={<p className="text-gray-500 text-sm">Not an admin</p>}>
                <p className="text-purple-600 text-sm">✅ Admin content visible</p>
              </AdminOnly>
            </div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        
        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh User Context
          </button>
          
          <PermissionGate permission={Permission.VIEW_REPORTS}>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              View Reports (Permission Required)
            </button>
          </PermissionGate>
          
          <AdminOnly>
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Admin Action (Role Required)
            </button>
          </AdminOnly>
        </div>
      </div>

      {/* Raw Permissions List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Permissions</h2>
        
        <div className="max-h-60 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {userContext.permissions.map(permission => (
              <div key={permission} className="bg-gray-100 px-2 py-1 rounded">
                {permission}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACTestPage;
