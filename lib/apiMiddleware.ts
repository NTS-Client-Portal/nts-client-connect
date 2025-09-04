/**
 * API Middleware for Role-Based Access Control
 * Priority 5 - Enhanced RBAC System
 * 
 * Secures API endpoints based on user roles and permissions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { 
  UserRole, 
  Permission, 
  createUserContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions 
} from '@/lib/roles';
import { Database } from '@/lib/database.types';

type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
type NtsUsersRow = Database['public']['Tables']['nts_users']['Row'];

// Extend NextApiRequest with user context
export interface AuthenticatedRequest extends NextApiRequest {
  userContext?: {
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
    assignedCompanyIds: string[];
  };
}

// API Response helper for consistent error responses
export const apiResponse = {
  success: (data: any, message?: string) => ({ 
    success: true, 
    data, 
    message: message || 'Success' 
  }),
  
  error: (message: string, statusCode: number = 400, details?: any) => ({
    success: false,
    error: message,
    statusCode,
    details
  }),
  
  unauthorized: (message: string = 'Unauthorized access') => ({
    success: false,
    error: message,
    statusCode: 401
  }),
  
  forbidden: (message: string = 'Insufficient permissions') => ({
    success: false,
    error: message,
    statusCode: 403
  }),
  
  notFound: (message: string = 'Resource not found') => ({
    success: false,
    error: message,
    statusCode: 404
  })
};

/**
 * Authentication middleware - verifies user session and loads context
 */
export const withAuth = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const supabase = createServerSupabaseClient({ req, res });
    
    try {
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const response = apiResponse.unauthorized('No valid session found');
        return res.status(401).json(response);
      }

      // Try to fetch user from profiles table first (shipper)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData && !profileError) {
        // User is a shipper
        const userContext = createUserContext(profileData, 'shipper');
        (req as AuthenticatedRequest).userContext = {
          ...userContext,
          assignedCompanyIds: userContext.companyId ? [userContext.companyId] : []
        };
        
        return handler(req as AuthenticatedRequest, res);
      }

      // Try nts_users table
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
        
        if (userContext.role === UserRole.SALES_REP) {
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .eq('sales_user_id', session.user.id);

          if (assignmentData && !assignmentError) {
            assignedCompanyIds = assignmentData.map(assignment => assignment.company_id);
          }
        }

        (req as AuthenticatedRequest).userContext = {
          ...userContext,
          assignedCompanyIds
        };
        
        return handler(req as AuthenticatedRequest, res);
      }

      // User not found in either table
      const response = apiResponse.unauthorized('User profile not found');
      return res.status(401).json(response);

    } catch (error) {
      console.error('Authentication error:', error);
      const response = apiResponse.error('Authentication failed', 500);
      return res.status(500).json(response);
    }
  };
};

/**
 * Role-based authorization middleware
 */
export const withRoles = (
  allowedRoles: UserRole | UserRole[],
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { userContext } = req;
    
    if (!userContext) {
      const response = apiResponse.unauthorized();
      return res.status(401).json(response);
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userContext.role)) {
      const response = apiResponse.forbidden(
        `Access denied. Required roles: ${roles.join(', ')}`
      );
      return res.status(403).json(response);
    }

    return handler(req, res);
  });
};

/**
 * Permission-based authorization middleware
 */
export const withPermissions = (
  requiredPermissions: Permission | Permission[],
  requireAll: boolean = false,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { userContext } = req;
    
    if (!userContext) {
      const response = apiResponse.unauthorized();
      return res.status(401).json(response);
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasAccess = requireAll 
      ? hasAllPermissions(userContext, permissions)
      : hasAnyPermission(userContext, permissions);
    
    if (!hasAccess) {
      const response = apiResponse.forbidden(
        `Access denied. Required permissions: ${permissions.join(', ')}`
      );
      return res.status(403).json(response);
    }

    return handler(req, res);
  });
};

/**
 * Admin-only middleware (includes super admin)
 */
export const withAdminAccess = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN], handler);
};

/**
 * Super admin only middleware
 */
export const withSuperAdminAccess = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withRoles(UserRole.SUPER_ADMIN, handler);
};

/**
 * Company access validation middleware
 * Ensures users can only access data from companies they're authorized to see
 */
export const withCompanyAccess = (
  getCompanyIdFromRequest: (req: AuthenticatedRequest) => string | string[] | undefined,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { userContext } = req;
    
    if (!userContext) {
      const response = apiResponse.unauthorized();
      return res.status(401).json(response);
    }

    // Super admins and admins can access all companies
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userContext.role)) {
      return handler(req, res);
    }

    const requestedCompanyIds = getCompanyIdFromRequest(req);
    
    if (!requestedCompanyIds) {
      const response = apiResponse.error('Company ID not provided');
      return res.status(400).json(response);
    }

    const companyIds = Array.isArray(requestedCompanyIds) ? requestedCompanyIds : [requestedCompanyIds];
    
    // Check access to each requested company
    for (const companyId of companyIds) {
      let hasAccess = false;
      
      // Shippers can only access their own company
      if (userContext.userType === 'shipper') {
        hasAccess = userContext.companyId === companyId;
      }
      // Sales reps and managers can access assigned companies
      else if (userContext.role === UserRole.SALES_REP) {
        hasAccess = userContext.assignedCompanyIds.includes(companyId);
      }
      
      if (!hasAccess) {
        const response = apiResponse.forbidden(
          `Access denied to company: ${companyId}`
        );
        return res.status(403).json(response);
      }
    }

    return handler(req, res);
  });
};

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const withRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { userContext } = req;
    const userId = userContext?.id;
    
    if (!userId) {
      const response = apiResponse.unauthorized();
      return res.status(401).json(response);
    }

    const now = Date.now();
    const userKey = `${userId}:${req.url}`;
    const userRequests = requestCounts.get(userKey);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize count
      requestCounts.set(userKey, {
        count: 1,
        resetTime: now + windowMs
      });
    } else if (userRequests.count >= maxRequests) {
      // Rate limit exceeded
      const response = apiResponse.error(
        'Rate limit exceeded. Please try again later.',
        429
      );
      return res.status(429).json(response);
    } else {
      // Increment count
      userRequests.count++;
    }

    return handler(req, res);
  });
};

/**
 * Method-specific middleware wrapper
 */
export const withMethods = (
  allowedMethods: string[],
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (!req.method || !allowedMethods.includes(req.method)) {
      const response = apiResponse.error(
        `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        405
      );
      return res.status(405).json(response);
    }

    return handler(req, res);
  };
};

/**
 * Combination middleware for common patterns
 */
export const createApiHandler = (config: {
  methods?: string[];
  roles?: UserRole | UserRole[];
  permissions?: Permission | Permission[];
  requireAllPermissions?: boolean;
  companyAccess?: (req: AuthenticatedRequest) => string | string[] | undefined;
  rateLimit?: { maxRequests: number; windowMs: number };
}) => {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    let wrappedHandler = handler;

    // Apply middleware in reverse order (last applied executes first)
    
    // Rate limiting (innermost)
    if (config.rateLimit) {
      wrappedHandler = withRateLimit(
        config.rateLimit.maxRequests,
        config.rateLimit.windowMs,
        wrappedHandler
      );
    }

    // Company access validation
    if (config.companyAccess) {
      wrappedHandler = withCompanyAccess(config.companyAccess, wrappedHandler);
    }

    // Permission-based access
    if (config.permissions) {
      wrappedHandler = withPermissions(
        config.permissions,
        config.requireAllPermissions,
        wrappedHandler
      );
    }

    // Role-based access
    if (config.roles) {
      wrappedHandler = withRoles(config.roles, wrappedHandler);
    }

    // Method validation
    if (config.methods) {
      wrappedHandler = withMethods(config.methods, wrappedHandler);
    }

    return wrappedHandler;
  };
};
