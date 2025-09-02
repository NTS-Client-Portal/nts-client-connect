import React, { useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@lib/database.types';
import { X } from 'lucide-react';

interface RejectReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        notes: string;
        status: string;
        quote: Database['public']['Tables']['shippingquotes']['Row'];
    }) => void;
    quote: Database['public']['Tables']['shippingquotes']['Row'] | null;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({ onClose, onSubmit, isOpen, quote }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [yes, setYes] = useState(false);
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

    const predefinedReasons = [
        'Price too high',
        'Found a better offer',
        'Purchase no longer needed',
        'Purchase did not go through',
        'Rescheduling - unknown date',
        'Other'
    ];

    const handleRejected = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quote) {
            console.error('Quote is null or undefined');
            return;
        }
        setLoading(true);

        const { data: currentData, error: fetchError } = await supabase
            .from('shippingquotes')
            .select('notes')
            .eq('id', quote.id)
            .single();

        if (fetchError) {
            console.error('Error fetching current notes:', fetchError.message);
            setLoading(false);
            return;
        }

        const updatedNotes = currentData.notes
            ? `${currentData.notes}\n${selectedReasons.join(', ')}${notes ? `: ${notes}` : ''}`
            : `${selectedReasons.join(', ')}${notes ? `: ${notes}` : ''}`;

        onSubmit({
            notes: updatedNotes,
            status: 'Rejected',
            quote,
        });

        const { error } = await supabase
            .from('shippingquotes')
            .update({ status: 'Rejected', notes: updatedNotes })
            .eq('id', quote.id);

        setLoading(false);

        if (error) {
            console.error('Error updating quote:', error.message);
            return;
        }

        onClose();
    };

    const handleYes = () => {
        setYes(true);
    };

    const handleReasonClick = (reason: string) => {
        setSelectedReasons((prevReasons) =>
            prevReasons.includes(reason)
                ? prevReasons.filter((r) => r !== reason)
                : [...prevReasons, reason]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Reject Quote</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleRejected} className="space-y-4">
                    <div>
                        <p className="text-gray-700 mb-4">
                            Are you sure you would like to reject this quote?
                        </p>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                No
                            </button>
                            <button 
                                type="button" 
                                onClick={handleYes} 
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                    
                    {yes && (
                        <div className="space-y-4 border-t border-gray-200 pt-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Please select a reason for rejection:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {predefinedReasons.map((reason) => (
                                        <button
                                            key={reason}
                                            type="button"
                                            onClick={() => handleReasonClick(reason)}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                selectedReasons.includes(reason)
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {selectedReasons.includes('Other') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional details
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Please provide a reason for rejecting the quote"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            )}
                            
                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading || selectedReasons.length === 0} 
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-md transition-colors"
                                >
                                    {loading ? 'Submitting...' : 'Reject Quote'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RejectReasonModal;