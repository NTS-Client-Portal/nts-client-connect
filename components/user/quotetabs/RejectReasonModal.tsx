import React, { useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@lib/database.types';

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
            status: 'rejected',
            quote,
        });

        const { error } = await supabase
            .from('shippingquotes')
            .update({ status: 'rejected', notes: updatedNotes })
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
        <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded shadow-md w-1/3">
                <h2 className="text-2xl font-semibold mb-4">Reject Quote</h2>
                <form onSubmit={handleRejected} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <p>Are you sure you would like to reject this Quote?</p>
                        <div className="flex justify-start gap-2 mt-3">
                            <button type="button" onClick={onClose} className="cancel-btn">
                                No
                            </button>
                            <button type="button" onClick={handleYes} className="bg-red-500 hover:bg-red-500/90 text-white rounded-sm px-4 py-2">
                                Yes
                            </button>
                        </div>
                    </div>
                    {yes && (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {predefinedReasons.map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => handleReasonClick(reason)}
                                        className={`bg-gray-200 text-gray-700 px-2 py-1 rounded ${selectedReasons.includes(reason) ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            {selectedReasons.includes('Other') && (
                                <textarea
                                    className="border border-gray-300 rounded p-2 mt-2"
                                    placeholder="Please provide a reason for rejecting the quote"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            )}
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={onClose} className="cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="body-btn">
                                    Submit
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RejectReasonModal;