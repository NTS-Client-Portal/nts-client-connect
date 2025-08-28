/**
 * Example: Secured API Endpoint using RBAC Middleware
 * Priority 5 - Enhanced RBAC System
 * 
 * This demonstrates how to secure API endpoints with role-based access control
 */

import { NextApiResponse } from 'next';
import { 
  AuthenticatedRequest, 
  createApiHandler,
  apiResponse 
} from '@/lib/apiMiddleware';
import { UserRole, Permission } from '@/lib/roles';
import { supabase } from '@/lib/initSupabase';

/**
 * GET /api/quotes - View quotes based on user role and permissions
 * 
 * Permissions:
 * - Shippers: Can view their own company's quotes
 * - Sales reps: Can view assigned companies' quotes  
 * - Admins: Can view all quotes
 */
const getQuotes = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { userContext } = req;
    const { page = '1', limit = '10', status, company_id } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    console.log(`Fetching quotes for user: ${userContext?.email} (${userContext?.role})`);

    // Build base query
    let query = supabase
      .from('shippingquotes')
      .select('*, companies(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Apply role-based filtering
    if (userContext?.userType === 'shipper') {
      // Shippers can only see their own company's quotes
      if (userContext.companyId) {
        query = query.eq('company_id', userContext.companyId);
      } else {
        // Fallback: filter by user_id if no company_id
        query = query.eq('user_id', userContext.id);
      }
    } else if (userContext?.userType === 'nts_user') {
      // Sales reps can see assigned companies' quotes
      if (userContext.role === UserRole.SALES_REP || userContext.role === UserRole.MANAGER) {
        if (userContext.assignedCompanyIds.length > 0) {
          query = query.in('company_id', userContext.assignedCompanyIds);
        } else {
          // No assigned companies = no quotes visible
          return res.status(200).json(apiResponse.success({ quotes: [], total: 0 }));
        }
      }
      // Admins and super admins see all quotes (no additional filter)
    }

    // Apply additional filters
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    if (company_id && typeof company_id === 'string' && userContext?.role && [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userContext.role)) {
      // Only admins can filter by specific company_id
      query = query.eq('company_id', company_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json(apiResponse.error('Failed to fetch quotes', 500));
    }

    console.log(`Retrieved ${data?.length || 0} quotes (total: ${count})`);

    return res.status(200).json(apiResponse.success({
      quotes: data,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum)
    }));

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json(apiResponse.error('Internal server error', 500));
  }
};

/**
 * POST /api/quotes - Create a new quote
 * 
 * Permissions: CREATE_QUOTES required
 * Access: Users can only create quotes for their accessible companies
 */
const createQuote = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { userContext } = req;
    const quoteData = req.body;

    console.log(`Creating quote for user: ${userContext?.email} (${userContext?.role})`);

    // Validate required fields
    if (!quoteData.origin_city || !quoteData.destination_city) {
      return res.status(400).json(apiResponse.error('Origin and destination cities are required'));
    }

    // Determine company_id based on user role
    let companyId = quoteData.company_id;

    if (userContext?.userType === 'shipper') {
      // Shippers can only create quotes for their own company
      if (!userContext.companyId) {
        return res.status(400).json(apiResponse.error('Shipper must be associated with a company'));
      }
      companyId = userContext.companyId;
    } else if (userContext?.userType === 'nts_user') {
      // Sales reps can create quotes for assigned companies
      if (userContext.role === UserRole.SALES_REP || userContext.role === UserRole.MANAGER) {
        if (!companyId || !userContext.assignedCompanyIds.includes(companyId)) {
          return res.status(403).json(apiResponse.forbidden('Cannot create quote for this company'));
        }
      }
      // Admins can create quotes for any company (companyId from request body)
    }

    // Insert the quote
    const { data, error } = await supabase
      .from('shippingquotes')
      .insert({
        ...quoteData,
        company_id: companyId,
        user_id: userContext?.id,
        created_at: new Date().toISOString(),
        status: 'pending'
      })
      .select('*, companies(name)')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json(apiResponse.error('Failed to create quote', 500));
    }

    console.log(`Quote created successfully: ${data.id}`);

    return res.status(201).json(apiResponse.success(data, 'Quote created successfully'));

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json(apiResponse.error('Internal server error', 500));
  }
};

/**
 * PUT /api/quotes/[id] - Update a quote
 * 
 * Permissions: EDIT_QUOTES required
 * Access: Users can only update quotes from their accessible companies
 */
const updateQuote = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { userContext } = req;
    const { id } = req.query;
    const updates = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json(apiResponse.error('Valid quote ID is required'));
    }

    const quoteId = parseInt(id);
    if (isNaN(quoteId)) {
      return res.status(400).json(apiResponse.error('Quote ID must be a number'));
    }

    console.log(`Updating quote ${quoteId} for user: ${userContext?.email} (${userContext?.role})`);

    // First, fetch the quote to check access
    const { data: existingQuote, error: fetchError } = await supabase
      .from('shippingquotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (fetchError || !existingQuote) {
      return res.status(404).json(apiResponse.notFound('Quote not found'));
    }

    // Check company access
    const hasAccess = (
      userContext?.role === UserRole.ADMIN || 
      userContext?.role === UserRole.SUPER_ADMIN ||
      (userContext?.userType === 'shipper' && userContext.companyId === existingQuote.company_id) ||
      (userContext?.userType === 'nts_user' && userContext.assignedCompanyIds.includes(existingQuote.company_id!))
    );

    if (!hasAccess) {
      return res.status(403).json(apiResponse.forbidden('Cannot update this quote'));
    }

    // Perform the update
    const { data, error } = await supabase
      .from('shippingquotes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select('*, companies(name)')
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json(apiResponse.error('Failed to update quote', 500));
    }

    console.log(`Quote ${quoteId} updated successfully`);

    return res.status(200).json(apiResponse.success(data, 'Quote updated successfully'));

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json(apiResponse.error('Internal server error', 500));
  }
};

/**
 * DELETE /api/quotes/[id] - Delete a quote
 * 
 * Permissions: DELETE_QUOTES required
 * Access: Users can only delete quotes from their accessible companies
 */
const deleteQuote = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { userContext } = req;
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json(apiResponse.error('Valid quote ID is required'));
    }

    const quoteId = parseInt(id);
    if (isNaN(quoteId)) {
      return res.status(400).json(apiResponse.error('Quote ID must be a number'));
    }

    console.log(`Deleting quote ${quoteId} for user: ${userContext?.email} (${userContext?.role})`);

    // First, fetch the quote to check access
    const { data: existingQuote, error: fetchError } = await supabase
      .from('shippingquotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (fetchError || !existingQuote) {
      return res.status(404).json(apiResponse.notFound('Quote not found'));
    }

    // Check company access (same logic as update)
    const hasAccess = (
      userContext?.role === UserRole.ADMIN || 
      userContext?.role === UserRole.SUPER_ADMIN ||
      (userContext?.userType === 'shipper' && userContext.companyId === existingQuote.company_id) ||
      (userContext?.userType === 'nts_user' && userContext.assignedCompanyIds.includes(existingQuote.company_id!))
    );

    if (!hasAccess) {
      return res.status(403).json(apiResponse.forbidden('Cannot delete this quote'));
    }

    // Perform the deletion
    const { error } = await supabase
      .from('shippingquotes')
      .delete()
      .eq('id', quoteId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json(apiResponse.error('Failed to delete quote', 500));
    }

    console.log(`Quote ${quoteId} deleted successfully`);

    return res.status(200).json(apiResponse.success(null, 'Quote deleted successfully'));

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json(apiResponse.error('Internal server error', 500));
  }
};

// Create the API handler with RBAC middleware
const handler = createApiHandler({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  rateLimit: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
});

export default handler(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET':
      return createApiHandler({
        permissions: Permission.VIEW_QUOTES
      })(getQuotes)(req, res);
      
    case 'POST':
      return createApiHandler({
        permissions: Permission.CREATE_QUOTES
      })(createQuote)(req, res);
      
    case 'PUT':
      return createApiHandler({
        permissions: Permission.EDIT_QUOTES
      })(updateQuote)(req, res);
      
    case 'DELETE':
      return createApiHandler({
        permissions: Permission.DELETE_QUOTES
      })(deleteQuote)(req, res);
      
    default:
      return res.status(405).json(apiResponse.error('Method not allowed', 405));
  }
});

/**
 * Usage Example:
 * 
 * GET /api/quotes?page=1&limit=10&status=pending
 * - Returns quotes based on user role and permissions
 * - Automatically filters by accessible companies
 * 
 * POST /api/quotes
 * Body: { origin_city: "New York", destination_city: "Los Angeles", ... }
 * - Creates quote for appropriate company based on user role
 * 
 * PUT /api/quotes/123
 * Body: { status: "approved", price: 1500 }
 * - Updates quote if user has access to the company
 * 
 * DELETE /api/quotes/123
 * - Deletes quote if user has delete permissions and company access
 */
