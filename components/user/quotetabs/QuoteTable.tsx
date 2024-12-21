import React, { useState, useEffect } from 'react';
import { Database } from '@/lib/database.types';
import QuoteTableHeader from './QuoteTableHeader';
import QuoteTableRow from './QuoteTableRow';

interface QuoteTableProps {
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
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveQuote: (id: number) => Promise<void>;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (quoteId: number) => void;
    handleRespond: (quoteId: number, price: number) => void; // Update this line
    isAdmin: boolean;
    duplicateQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    reverseQuote: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
}

const QuoteTable: React.FC<QuoteTableProps> = ({
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
    expandedRow,
    handleRowClick,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
    duplicateQuote,
    reverseQuote,
}) => {
    const [currentPage, setCurrentPage] = useState(1); // Add state for current page
    const rowsPerPage = 10; // Define rows per page

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = quotes.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(quotes.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('id');

    useEffect(() => {
        const filtered = quotes.filter((quote) => {
            const value = quote[searchColumn]?.toString().toLowerCase() || '';
            return value.includes(searchTerm.toLowerCase());
        });
    
        setSortedQuotes(filtered);
    }, [searchTerm, searchColumn, quotes, setSortedQuotes]);

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
                <QuoteTableHeader
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                    setSortedQuotes={setSortedQuotes}
                    quotes={quotes}
                    setActiveTab={setActiveTab}
                    activeTab={activeTab}
                    quoteToEdit={quoteToEdit}
                    quote={quote}
                    companyId={companyId}
                    editHistory={editHistory}
                    fetchEditHistory={fetchEditHistory}
                />
                <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.map((quote, index) => (
                        <QuoteTableRow
                            key={quote.id}
                            quote={quote}
                            expandedRow={expandedRow}
                            handleRowClick={handleRowClick}
                            archiveQuote={archiveQuote}
                            handleEditClick={handleEditClick}
                            handleCreateOrderClick={handleCreateOrderClick}
                            handleRespond={handleRespond}
                            isAdmin={isAdmin}
                            rowIndex={index}
                            duplicateQuote={duplicateQuote}
                            reverseQuote={reverseQuote}
                        />
                    ))}
                </tbody>
            </table>
            <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-4 py-2 mx-1 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuoteTable;