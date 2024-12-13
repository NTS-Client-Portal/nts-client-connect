import React from 'react';
import { Database } from '@/lib/database.types';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';

interface QuoteTableRowProps {
    quote: Database['public']['Tables']['shippingquotes']['Row'];
    expandedRow: number | null;
    handleRowClick: (id: number) => void;
    archiveQuote: (id: number) => Promise<void>;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (quoteId: number) => void;
    handleRespond: (quoteId: number) => void;
    isAdmin: boolean;
}

const QuoteTableRow: React.FC<QuoteTableRowProps> = ({
    quote,
    expandedRow,
    handleRowClick,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
}) => {
    return (
        <>
            <tr onClick={() => handleRowClick(quote.id)} className="cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    <span className='text-base text-zinc-900'>{quote.container_length ? `${quote.container_length} ft ` : ''} {quote.container_type} </span> <br />
                    <span className='text-base text-zinc-900'>{quote.year ? `${quote.year} ` : ''} {quote.make} {quote.model}</span> <br />
                    <span className='font-semibold text-sm text-gray-700'>Freight Type:</span> {freightTypeMapping[quote.freight_type] || quote.freight_type.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.origin_city}, {quote.origin_state}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.destination_city}, {quote.destination_state}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(quote.due_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.is_complete ? 'Complete' : 'pending'}</td>
                <td className="px-6 py-3 whitespace-nowrap flex flex-col gap-1 items-normal justify-between z-50">
                    <button onClick={() => archiveQuote(quote.id)} className="text-red-500 ml-2">
                        Archive
                    </button>
                    <button
                        onClick={() => handleEditClick(quote)}
                        className="cancel-btn"
                    >
                        Edit
                    </button>
                    {quote.price ? (
                        <button
                            onClick={() => handleCreateOrderClick(quote.id)}
                            className="ml-2 p-1  body-btn text-white rounded"
                        >
                            Create Order
                        </button>
                    ) : null}
                    {isAdmin && (
                        <button onClick={() => handleRespond(quote.id)} className="text-blue-500 ml-2">
                            Respond
                        </button>
                    )}
                </td>
            </tr>
            {expandedRow === quote.id && (
                <tr>
                    <td colSpan={7} className="px-6 py-3">
                        {renderAdditionalDetails(quote)}
                    </td>
                </tr>
            )}
        </>
    );
};

export default QuoteTableRow;