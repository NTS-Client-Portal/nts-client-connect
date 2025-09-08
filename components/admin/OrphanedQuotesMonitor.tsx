import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface OrphanedQuote {
    id: number;
    user_id: string;
    status: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
    freight_type: string | null;
    needs_admin_review?: boolean | null;
}

const OrphanedQuotesMonitor: React.FC = () => {
    const supabase = useSupabaseClient<Database>();
    const [orphanedQuotes, setOrphanedQuotes] = useState<OrphanedQuote[]>([]);
    const [loading, setLoading] = useState(false);
    const [repairing, setRepairing] = useState<number | null>(null);

    const fetchOrphanedQuotes = async () => {
        setLoading(true);
        try {
            // Query for quotes needing admin review (either missing company_id OR explicitly flagged)
            const { data, error } = await supabase
                .from('shippingquotes')
                .select('id, user_id, status, first_name, last_name, created_at, freight_type, needs_admin_review')
                .or('company_id.is.null,needs_admin_review.eq.true')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orphaned quotes:', error);
            } else {
                setOrphanedQuotes(data || []);
            }
        } catch (error) {
            console.error('Error fetching orphaned quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const repairQuote = async (quoteId: number, userId: string) => {
        setRepairing(quoteId);
        try {
            // Try to find company_id from profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', userId)
                .single();

            let companyId = null;

            if (!profileError && profileData?.company_id) {
                companyId = profileData.company_id;
            } else {
                // Try nts_users table as fallback
                const { data: ntsData, error: ntsError } = await supabase
                    .from('nts_users')
                    .select('company_id')
                    .eq('id', userId)
                    .single();

                if (!ntsError && ntsData?.company_id) {
                    companyId = ntsData.company_id;
                }
            }

            if (companyId) {
                const { error: updateError } = await supabase
                    .from('shippingquotes')
                    .update({ 
                        company_id: companyId,
                        needs_admin_review: false, // Clear the review flag when repaired
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', quoteId);

                if (updateError) {
                    console.error('Error updating quote:', updateError);
                    alert('Failed to repair quote');
                } else {
                    alert('Quote repaired successfully!');
                    fetchOrphanedQuotes(); // Refresh the list
                }
            } else {
                alert('Could not find company assignment for this user. Manual intervention required.');
            }
        } catch (error) {
            console.error('Error repairing quote:', error);
            alert('Failed to repair quote');
        } finally {
            setRepairing(null);
        }
    };

    useEffect(() => {
        fetchOrphanedQuotes();
    }, []);

    if (loading) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking for orphaned quotes...</span>
                </div>
            </div>
        );
    }

    if (orphanedQuotes.length === 0) {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">All quotes properly assigned!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                    No orphaned quotes found. All submissions have proper company assignments.
                </p>
                <button
                    onClick={fetchOrphanedQuotes}
                    className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                >
                    Refresh check
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">
                    {orphanedQuotes.length} Quote{orphanedQuotes.length > 1 ? 's' : ''} Need Company Assignment
                </span>
            </div>
            
            <p className="text-sm text-yellow-700 mb-4">
                These quotes were submitted successfully but are missing company assignments or flagged for review. 
                NTS users cannot see them until they are properly assigned and the review flag is cleared.
            </p>

            <div className="space-y-3">
                {orphanedQuotes.map((quote) => (
                    <div key={quote.id} className="p-3 bg-white border border-yellow-300 rounded">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    Quote #{quote.id}
                                    {quote.needs_admin_review && (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full border border-red-200">
                                            Review Required
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {quote.first_name} {quote.last_name} • {quote.freight_type} • {quote.status}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Submitted: {new Date(quote.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                    User ID: {quote.user_id}
                                </div>
                            </div>
                            <button
                                onClick={() => repairQuote(quote.id, quote.user_id)}
                                disabled={repairing === quote.id}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {repairing === quote.id ? 'Repairing...' : 'Auto Repair'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={fetchOrphanedQuotes}
                className="mt-3 text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
                Refresh check
            </button>
        </div>
    );
};

export default OrphanedQuotesMonitor;
