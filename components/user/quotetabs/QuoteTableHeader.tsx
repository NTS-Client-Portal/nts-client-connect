import React, { useState, useEffect } from 'react';
import TableHeaderSort from './TableHeaderSort';
import EditHistory from '../../EditHistory'; // Adjust the import path as needed
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface QuoteTableHeaderProps {
    sortConfig: { column: string; order: string };
    handleSort: (column: string, order: string) => void;
    setSortedQuotes: React.Dispatch<React.SetStateAction<Database['public']['Tables']['shippingquotes']['Row'][]>>;
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    activeTab: string;
    quoteToEdit: Database['public']['Tables']['shippingquotes']['Row'] | null;
    quote: Database['public']['Tables']['shippingquotes']['Row'] | null; // Add quote prop
    companyId: string; // Add companyId prop
    editHistory: Database['public']['Tables']['edit_history']['Row'][]; // Add editHistory prop
    fetchEditHistory: (companyId: string) => void; // Add fetchEditHistory prop
}

const QuoteTableHeader: React.FC<QuoteTableHeaderProps> = ({
    sortConfig,
    handleSort,
    setSortedQuotes,
    quotes,
    setActiveTab,
    activeTab,
    quoteToEdit,
    quote, // Add quote prop
    companyId, // Add companyId prop
    editHistory, // Add editHistory prop
    fetchEditHistory, // Add fetchEditHistory prop
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');
    const [loading, setLoading] = useState(false);
    const supabase = useSupabaseClient<Database>();
    useEffect(() => {
        const filtered = quotes.filter((quote) => {
            const value = quote[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });

        setSortedQuotes(filtered);
    }, [searchTerm, searchColumn, quotes, setSortedQuotes]);

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'editHistory') {
            fetchEditHistory(companyId);
        }
    };

    return (
        <div className='w-full'>
            <div className="flex justify-start gap-4 my-4 ml-4">
                <div className="flex items-center">
                    <label className="mr-2">Search by:</label>
                    <select
                        value={searchColumn}
                        onChange={(e) => setSearchColumn(e.target.value)}
                        className="border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="id">ID</option>
                        <option value="freight_type">Freight Type</option>
                        <option value="origin_city">Origin City</option>
                        <option value="destination_city">Destination City</option>
                        <option value="due_date">Shipping Date</option>
                    </select>
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="border border-gray-300 pl-2 rounded-md shadow-sm"
                />
            </div>
            <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 static top-0 w-full">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3  text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="freight_type" sortOrder={sortConfig.column === 'freight_type' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="origin_city" sortOrder={sortConfig.column === 'origin_city' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="destination_city" sortOrder={sortConfig.column === 'destination_city' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="due_date" sortOrder={sortConfig.column === 'due_date' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            <TableHeaderSort column="price" sortOrder={sortConfig.column === 'price' ? sortConfig.order : null} onSort={handleSort} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
            </table>
        </div>
    );
};

export default QuoteTableHeader;