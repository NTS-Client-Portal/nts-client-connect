import React from 'react';

interface TableHeaderSortProps {
    column: string;
    sortOrder: string | null;
    onSort: (column: string, order: string) => void;
}

const TableHeaderSort: React.FC<TableHeaderSortProps> = ({ column, sortOrder, onSort }) => {
    const handleSort = () => {
        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        onSort(column, newOrder);
    };

    return (
        <button onClick={handleSort} className="flex items-center">
            {column}
            {sortOrder === 'asc' ? (
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
            ) : sortOrder === 'desc' ? (
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            ) : (
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5l-7 7h14l-7-7zM12 19l-7-7h14l-7 7z"></path>
                </svg>
            )}
        </button>
    );
};

export default TableHeaderSort;