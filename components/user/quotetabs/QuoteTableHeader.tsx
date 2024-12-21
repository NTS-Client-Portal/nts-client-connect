import React from 'react';
import TableHeaderSort from './TableHeaderSort';
import { Database } from '@/lib/database.types';

interface QuoteTableHeaderProps {
    sortConfig: { column: string; order: string };
    handleSort: (column: string, order: string) => void;
    setSortedQuotes: React.Dispatch<React.SetStateAction<Database['public']['Tables']['shippingquotes']['Row'][]>>;
    quotes: Database['public']['Tables']['shippingquotes']['Row'][];
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    activeTab: string;
    quoteToEdit: Database['public']['Tables']['shippingquotes']['Row'] | null;
    quote: Database['public']['Tables']['shippingquotes']['Row'] | null;
    companyId: string;
    editHistory: Database['public']['Tables']['edit_history']['Row'][];
    fetchEditHistory: (companyId: string) => void;
}

const QuoteTableHeader: React.FC<QuoteTableHeaderProps> = ({
    sortConfig,
    handleSort,
    setSortedQuotes,
    quotes,
    setActiveTab,
    activeTab,
    quoteToEdit,
    quote,
    companyId,
    editHistory,
    fetchEditHistory,
}) => {
    return (
        <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 static top-0 w-full">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <TableHeaderSort column="id" sortOrder={sortConfig.column === 'id' ? sortConfig.order : 'desc'} onSort={handleSort} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
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
    );
};

export default QuoteTableHeader;