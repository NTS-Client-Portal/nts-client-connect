import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/initSupabase'; // Adjust the import path as needed

interface EditHistoryProps {
    quoteId: number;
}

interface EditHistoryEntry {
    id: string;
    quote_id: number;
    edited_by: string;
    edited_at: string;
    changes: string;
    first_name: string | null;
    last_name: string | null;
}

const EditHistory: React.FC<EditHistoryProps> = ({ quoteId }) => {
    const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEditHistory = async () => {
            const { data, error } = await supabase
                .from('edit_history')
                .select('*, profiles(first_name, last_name)')
                .eq('quote_id', quoteId)
                .order('edited_at', { ascending: false });

            if (error) {
                console.error('Error fetching edit history:', error.message);
            } else {
                const formattedData = data.map((entry: any) => ({
                    ...entry,
                    first_name: entry.profiles.first_name,
                    last_name: entry.profiles.last_name,
                }));
                setEditHistory(formattedData);
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

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">Edit History</h3>
            {editHistory.length === 0 ? (
                <div>No edit history available.</div>
            ) : (
                <ul>
                    {editHistory.map((entry) => (
                        <li key={entry.id} className="mb-4">
                            <div>
                                <strong>Edited By:</strong> {entry.first_name} {entry.last_name}
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
            )}
        </div>
    );
};

export default EditHistory;