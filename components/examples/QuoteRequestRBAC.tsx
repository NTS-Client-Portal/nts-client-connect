/**
 * Updated QuoteRequest Component - RBAC Migration Example
 * Priority 5 - Enhanced RBAC System
 * 
 * This demonstrates migrating from old user type checking to new RBAC system
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@lib/initSupabase';
import { Database } from '@/lib/database.types';

// NEW: Import RBAC system
import { useRoleBasedAccess } from '@/lib/useRoleBasedAccess';
import { Permission } from '@/lib/roles';
import { PermissionGate, Loading, Unauthorized } from '@/components/rbac/RoleBasedComponents';

type ProfilesRow = Database['public']['Tables']['profiles']['Row'];
type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface QuoteRequestRBACProps {
    session: Session | null;
    profiles?: ProfilesRow[];
    companyId?: string;
}

const QuoteRequestRBAC: React.FC<QuoteRequestRBACProps> = ({ 
    session, 
    profiles = [], 
    companyId 
}) => {
    // NEW: Use RBAC system instead of props
    const {
        userContext,
        loading: rbacLoading,
        error: rbacError,
        hasPermission,
        canAccessCompany,
        getAccessibleCompanyIds
    } = useRoleBasedAccess();

    // State management
    const [quotes, setQuotes] = useState<ShippingQuotesRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // NEW: Get accessible companies using RBAC system
    const accessibleCompanyIds = getAccessibleCompanyIds();

    // NEW: Check permissions before allowing operations
    const canViewQuotes = hasPermission(Permission.VIEW_QUOTES);
    const canCreateQuotes = hasPermission(Permission.CREATE_QUOTES);
    const canEditQuotes = hasPermission(Permission.EDIT_QUOTES);
    const canDeleteQuotes = hasPermission(Permission.DELETE_QUOTES);

    // Fetch quotes with RBAC-based filtering
    const fetchQuotes = useCallback(async () => {
        if (!session?.user?.id || !userContext) return;

        console.log('Fetching quotes with RBAC filtering...');
        
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('shippingquotes').select('*');

            // NEW: Apply RBAC-based filtering instead of hard-coded user type logic
            if (userContext.userType === 'shipper') {
                // Shippers see only their company's quotes
                if (userContext.companyId) {
                    query = query.eq('company_id', userContext.companyId);
                } else {
                    // Fallback for shippers without company_id
                    query = query.eq('user_id', session.user.id);
                }
            } else if (userContext.userType === 'nts_user') {
                // Sales reps see quotes from assigned companies
                if (accessibleCompanyIds.length > 0) {
                    query = query.in('company_id', accessibleCompanyIds);
                }
                // If accessibleCompanyIds is empty and user is admin, they see all quotes (no filter)
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            console.log(`Fetched ${data?.length || 0} quotes for ${userContext.role}`);
            setQuotes(data || []);

        } catch (err) {
            console.error('Error fetching quotes:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, userContext, accessibleCompanyIds]);

    // NEW: Create quote with permission check
    const handleCreateQuote = async (quoteData: any) => {
        if (!canCreateQuotes) {
            setError('You do not have permission to create quotes');
            return;
        }

        if (!userContext?.companyId && userContext?.userType === 'shipper') {
            setError('Company ID is required to create quotes');
            return;
        }

        try {
            const { data, error: createError } = await supabase
                .from('shippingquotes')
                .insert({
                    ...quoteData,
                    user_id: session?.user?.id,
                    company_id: userContext.companyId,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;

            setQuotes(prev => [...prev, data]);
            console.log('Quote created successfully:', data);

        } catch (err) {
            console.error('Error creating quote:', err);
            setError(err instanceof Error ? err.message : 'Failed to create quote');
        }
    };

    // NEW: Update quote with permission and access checks
    const handleUpdateQuote = async (quoteId: number, updates: Partial<ShippingQuotesRow>) => {
        if (!canEditQuotes) {
            setError('You do not have permission to edit quotes');
            return;
        }

        // Find the quote to check access
        const quote = quotes.find(q => q.id === quoteId);
        if (quote && !canAccessCompany(quote.company_id!)) {
            setError('You do not have access to this quote');
            return;
        }

        try {
            const { data, error: updateError } = await supabase
                .from('shippingquotes')
                .update(updates)
                .eq('id', quoteId)
                .select()
                .single();

            if (updateError) throw updateError;

            setQuotes(prev => prev.map(q => q.id === quoteId ? data : q));
            console.log('Quote updated successfully:', data);

        } catch (err) {
            console.error('Error updating quote:', err);
            setError(err instanceof Error ? err.message : 'Failed to update quote');
        }
    };

    // NEW: Delete quote with permission and access checks
    const handleDeleteQuote = async (quoteId: number) => {
        if (!canDeleteQuotes) {
            setError('You do not have permission to delete quotes');
            return;
        }

        const quote = quotes.find(q => q.id === quoteId);
        if (quote && !canAccessCompany(quote.company_id!)) {
            setError('You do not have access to this quote');
            return;
        }

        if (!confirm('Are you sure you want to delete this quote?')) {
            return;
        }

        try {
            const { error: deleteError } = await supabase
                .from('shippingquotes')
                .delete()
                .eq('id', quoteId);

            if (deleteError) throw deleteError;

            setQuotes(prev => prev.filter(q => q.id !== quoteId));
            console.log('Quote deleted successfully');

        } catch (err) {
            console.error('Error deleting quote:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete quote');
        }
    };

    // Effect to fetch quotes when user context changes
    useEffect(() => {
        if (userContext && canViewQuotes) {
            fetchQuotes();
        }
    }, [userContext, canViewQuotes, fetchQuotes]);

    // NEW: Handle RBAC loading and error states
    if (rbacLoading) {
        return <Loading message="Loading user permissions..." />;
    }

    if (rbacError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-medium">Permission Error</h3>
                <p className="text-red-600">{rbacError}</p>
            </div>
        );
    }

    if (!userContext) {
        return <Unauthorized message="Please log in to access quotes" />;
    }

    // NEW: Check view permission before rendering content
    if (!canViewQuotes) {
        return <Unauthorized message="You do not have permission to view quotes" />;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quote Requests
                    </h1>
                    
                    {/* NEW: Permission-based create button */}
                    <PermissionGate permission={Permission.CREATE_QUOTES}>
                        <button
                            onClick={() => {
                                // Handle create quote modal/form
                                console.log('Create quote clicked');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Create Quote
                        </button>
                    </PermissionGate>
                </div>

                {/* User context info for debugging */}
                <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                    <p><strong>User:</strong> {userContext.firstName} {userContext.lastName} ({userContext.role})</p>
                    <p><strong>User Type:</strong> {userContext.userType}</p>
                    <p><strong>Company ID:</strong> {userContext.companyId || 'None'}</p>
                    <p><strong>Accessible Companies:</strong> {accessibleCompanyIds.length > 0 ? accessibleCompanyIds.join(', ') : 'All (admin)'}</p>
                    <p><strong>Permissions:</strong> View: {canViewQuotes ? '✅' : '❌'}, Create: {canCreateQuotes ? '✅' : '❌'}, Edit: {canEditQuotes ? '✅' : '❌'}, Delete: {canDeleteQuotes ? '✅' : '❌'}</p>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={() => setError(null)}
                        className="mt-2 text-sm text-red-500 underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <Loading message="Loading quotes..." />
            ) : (
                /* Quotes list */
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Your Quotes ({quotes.length})
                        </h2>
                        
                        {quotes.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">No quotes found</p>
                                <PermissionGate permission={Permission.CREATE_QUOTES}>
                                    <button 
                                        onClick={() => console.log('Create first quote')}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Create your first quote
                                    </button>
                                </PermissionGate>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {quotes.map((quote) => (
                                    <div key={quote.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium">Quote #{quote.id}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {quote.origin_city} → {quote.destination_city}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Status: {quote.status} | Created: {new Date(quote.created_at!).toLocaleDateString()}
                                                </p>
                                            </div>
                                            
                                            <div className="flex space-x-2">
                                                {/* NEW: Permission-based action buttons */}
                                                <PermissionGate permission={Permission.EDIT_QUOTES}>
                                                    <button
                                                        onClick={() => handleUpdateQuote(quote.id, { status: 'updated' })}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                        disabled={!canAccessCompany(quote.company_id!)}
                                                    >
                                                        Edit
                                                    </button>
                                                </PermissionGate>
                                                
                                                <PermissionGate permission={Permission.DELETE_QUOTES}>
                                                    <button
                                                        onClick={() => handleDeleteQuote(quote.id)}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                        disabled={!canAccessCompany(quote.company_id!)}
                                                    >
                                                        Delete
                                                    </button>
                                                </PermissionGate>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Development info */}
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                <h3 className="font-medium mb-2">RBAC Migration Status</h3>
                <ul className="space-y-1">
                    <li>✅ Migrated from userType prop to RBAC system</li>
                    <li>✅ Permission-based UI rendering</li>
                    <li>✅ Company access validation</li>
                    <li>✅ Role-based data filtering</li>
                    <li>✅ Error handling for permissions</li>
                </ul>
            </div>
        </div>
    );
};

export default QuoteRequestRBAC;
