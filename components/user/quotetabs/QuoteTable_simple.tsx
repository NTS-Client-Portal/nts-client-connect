// This is a simplified version of the table - just the part we need to replace

const SimpleTable = ({ currentRows, handleRowClick, formatDate, freightTypeMapping, handleEditClick, duplicateQuote, reverseQuote }) => (
    <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="modern-table">
            <thead>
                <tr>
                    <th>Quote ID</th>
                    <th>Created</th>
                    <th>Freight Type</th>
                    <th>Route</th>
                    <th>Due Date</th>
                    <th>Price</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {currentRows.map((quote, index) => (
                    <tr key={quote.id} onClick={() => handleRowClick(quote.id)}>
                        <td>
                            <strong className="text-blue-600">#{quote.id}</strong>
                        </td>
                        <td>{formatDate(quote.created_at)}</td>
                        <td>{freightTypeMapping[quote.freight_type] || quote.freight_type}</td>
                        <td>
                            <div>
                                <div className="text-green-700">📍 {quote.origin_city}, {quote.origin_state}</div>
                                <div className="text-red-700">📍 {quote.destination_city}, {quote.destination_state}</div>
                            </div>
                        </td>
                        <td>{quote.due_date ? formatDate(quote.due_date) : 'Not set'}</td>
                        <td>
                            {quote.price ? (
                                <strong className="text-green-600">${quote.price.toLocaleString()}</strong>
                            ) : (
                                <span className="text-gray-500">Pending</span>
                            )}
                        </td>
                        <td>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(quote);
                                }}
                                className="action-btn btn-edit"
                                title="Edit Quote"
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateQuote(quote);
                                }}
                                className="action-btn btn-copy"
                                title="Copy Quote"
                            >
                                Copy
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    reverseQuote(quote);
                                }}
                                className="action-btn btn-reverse"
                                title="Reverse Route"
                            >
                                Reverse
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
