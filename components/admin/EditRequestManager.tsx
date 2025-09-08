import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { Clock, CheckCircle, XCircle, Eye, User, Calendar, MessageSquare } from 'lucide-react';
import { formatQuoteId } from '@/lib/quoteUtils';

interface EditRequest {
    id: number;
    quote_id: number;
    requested_by: string;
    requested_at: string;
    requested_changes: Record<string, any>;
    reason: string | null;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
    company_id: string;
}

interface EditRequestManagerProps {
    session: any;
    companyId: string;
    isAdmin: boolean;
}

const EditRequestManager: React.FC<EditRequestManagerProps> = ({ session, companyId, isAdmin }) => {
    const supabase = useSupabaseClient<Database>();
    const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    const fetchEditRequests = useCallback(async () => {
        if (!session?.user?.id || !companyId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('edit_requests')
                .select('*')
                .eq('company_id', companyId)
                .order('requested_at', { ascending: false });

            if (error) {
                console.error('Error fetching edit requests:', error);
            } else {
                setEditRequests(
                    (data || []).map((item) => ({
                        ...item,
                        status: item.status as 'pending' | 'approved' | 'rejected',
                        requested_changes:
                            typeof item.requested_changes === 'string'
                                ? JSON.parse(item.requested_changes)
                                : item.requested_changes || {},
                    }))
                );
            }
        } catch (error) {
            console.error('Error fetching edit requests:', error);
        } finally {
            setLoading(false);
        }
    }, [session, companyId, supabase]);

    useEffect(() => {
        fetchEditRequests();
    }, [fetchEditRequests]);

    const handleReviewRequest = async (requestId: number, status: 'approved' | 'rejected') => {
        if (!session?.user?.id) return;

        setIsReviewing(true);
        try {
            const { error: updateError } = await supabase
                .from('edit_requests')
                .update({
                    status,
                    reviewed_by: session.user.id,
                    reviewed_at: new Date().toISOString(),
                    review_notes: reviewNotes || null
                })
                .eq('id', requestId);

            if (updateError) {
                console.error('Error updating edit request:', updateError);
                alert('Failed to update edit request');
                return;
            }

            // If approved, apply the changes to the quote
            if (status === 'approved' && selectedRequest) {
                const { error: quoteUpdateError } = await supabase
                    .from('shippingquotes')
                    .update(
                        Object.keys(selectedRequest.requested_changes).reduce((acc, key) => {
                            acc[key] = selectedRequest.requested_changes[key].to;
                            return acc;
                        }, {} as Record<string, any>)
                    )
                    .eq('id', selectedRequest.quote_id);

                if (quoteUpdateError) {
                    console.error('Error applying changes to quote:', quoteUpdateError);
                    alert('Edit request was approved but failed to apply changes to quote');
                    return;
                }
            }

            alert(`Edit request ${status} successfully!`);
            setSelectedRequest(null);
            setReviewNotes('');
            fetchEditRequests(); // Refresh the list
        } catch (error) {
            console.error('Error reviewing request:', error);
            alert('Failed to process edit request');
        } finally {
            setIsReviewing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'approved':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const formatChange = (key: string, change: any) => {
        return (
            <div key={key} className="mb-2">
                <span className="font-medium">{key.replace(/_/g, ' ').toUpperCase()}:</span>
                <div className="ml-4">
                    <span className="text-red-600 line-through">{change.from || 'empty'}</span>
                    {' → '}
                    <span className="text-green-600 font-medium">{change.to || 'empty'}</span>
                </div>
            </div>
        );
    };

    if (!isAdmin) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">Only NTS users can manage edit requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Edit Requests</h2>
                <button
                    onClick={fetchEditRequests}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Edit Requests List */}
            <div className="grid gap-4">
                {editRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No edit requests found</p>
                    </div>
                ) : (
                    editRequests.map((request) => (
                        <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(request.status)}
                                    <div>
                                        <h3 className="font-medium">
                                            Edit Request for Quote {formatQuoteId(request.quote_id)}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Requested {new Date(request.requested_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={getStatusBadge(request.status)}>
                                    {request.status.toUpperCase()}
                                </span>
                            </div>

                            {request.reason && (
                                <div className="mb-3 p-3 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Reason:</span> {request.reason}
                                    </p>
                                </div>
                            )}

                            <div className="mb-3">
                                <h4 className="font-medium text-sm text-gray-700 mb-2">Requested Changes:</h4>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                    {Object.entries(request.requested_changes).map(([key, change]) =>
                                        formatChange(key, change)
                                    )}
                                </div>
                            </div>

                            {request.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                    >
                                        Review
                                    </button>
                                </div>
                            )}

                            {request.reviewed_at && (
                                <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                                    <p>
                                        Reviewed {new Date(request.reviewed_at).toLocaleDateString()}
                                        {request.review_notes && (
                                            <span className="block mt-1">
                                                <span className="font-medium">Notes:</span> {request.review_notes}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            Review Edit Request for Quote {formatQuoteId(selectedRequest.quote_id)}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Requested Changes:</h4>
                                <div className="bg-gray-50 p-4 rounded">
                                    {Object.entries(selectedRequest.requested_changes).map(([key, change]) =>
                                        formatChange(key, change)
                                    )}
                                </div>
                            </div>

                            {selectedRequest.reason && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Reason:</h4>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedRequest.reason}</p>
                                </div>
                            )}

                            <div>
                                <label className="block font-medium text-gray-700 mb-2">
                                    Review Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add any notes about your decision..."
                                    className="w-full p-3 border border-gray-300 rounded-md h-20 resize-none"
                                    maxLength={500}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleReviewRequest(selectedRequest.id, 'approved')}
                                    disabled={isReviewing}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                    {isReviewing ? 'Processing...' : 'Approve & Apply Changes'}
                                </button>
                                <button
                                    onClick={() => handleReviewRequest(selectedRequest.id, 'rejected')}
                                    disabled={isReviewing}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    {isReviewing ? 'Processing...' : 'Reject'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setReviewNotes('');
                                    }}
                                    disabled={isReviewing}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditRequestManager;
