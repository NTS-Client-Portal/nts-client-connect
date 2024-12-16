import React from 'react';
import { Database } from '@/lib/database.types';

interface HistoryTabProps {
    editHistory: Database['public']['Tables']['edit_history']['Row'][]; // Add editHistory prop
    searchTerm: string;
    searchColumn: string;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ editHistory, searchTerm, searchColumn }) => {
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

export default HistoryTab;