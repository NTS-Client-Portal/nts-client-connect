import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/initSupabase'; // Adjust the import path as needed

interface EditHistoryProps {
    quoteId: number;
    searchTerm: string;
    searchColumn: string;
}

interface EditHistoryEntry {
    id: number;
    quote_id: number;
    edited_by: string;
    edited_at: string;
    changes: string;
}

const EditHistory: React.FC<EditHistoryProps> = ({ quoteId, searchTerm, searchColumn }) => {
    const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEditHistory = async () => {
            console.log('Fetching edit history for quoteId:', quoteId);
            const { data, error } = await supabase
                .from('edit_history')
                .select('*')
                .eq('quote_id', quoteId)
                .order('edited_at', { ascending: false });

            if (error) {
                console.error('Error fetching edit history:', error.message);
            } else {
                console.log('Fetched edit history:', data);
                setEditHistory(data);
            }

            setLoading(false);
        };

        fetchEditHistory();
    }, [quoteId]);

    const formatChangeKey = (key: string) => {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatChanges = (changes: string) => {
        const parsedChanges = JSON.parse(changes);
        return Object.keys(parsedChanges).map((key) => (
            <div key={key}>
                <strong>{formatChangeKey(key)}:</strong> {parsedChanges[key].old} → {parsedChanges[key].new}
            </div>
        ));
    };

    const filteredEditHistory = editHistory.filter((entry) => {
        const value = entry[searchColumn]?.toString().toLowerCase() || '';
        return value.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className='overflow-y-auto'>
            <h3 className="text-lg font-bold mb-4">Edit History</h3>
            {filteredEditHistory.length === 0 ? (
                <div>No edit history available.</div>
            ) : (
                <div className='overflow-y-auto'>
                    <ul>
                        {filteredEditHistory.map((entry) => (
                            <li key={entry.id} className="mb-4">
                                <div>
                                    <strong>Edited By:</strong> {entry.edited_by}
                                </div>
                                <div>
                                    <strong>Edited At:</strong> {new Date(entry.edited_at).toLocaleString()}
                                </div>
                                <div>
                                    <strong>Changes:</strong>
                                    {formatChanges(entry.changes)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EditHistory;