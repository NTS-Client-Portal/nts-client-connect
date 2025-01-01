import React, { useState } from 'react';
import { ListingCard } from './ListingCard';
import { Pagination } from './Pagination';
import { SideBar } from './SideBar';

interface ListingsContainerProps {
    quotes: any[];
}

export const ListingsContainer: React.FC<ListingsContainerProps> = ({ quotes }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredQuotes, setFilteredQuotes] = useState(quotes);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
    const paginatedQuotes = filteredQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSearch = (filters: any) => {
        const { destination, vehicleType, trailerType, vehicleStatus } = filters;
        const filtered = quotes.filter((quote) => {
            return (
                (!destination || quote.destination_city.includes(destination)) &&
                (!vehicleType || quote.vehicle_type === vehicleType) &&
                (!trailerType || quote.trailer_type === trailerType) &&
                (!vehicleStatus || quote.vehicle_status === vehicleStatus)
            );
        });
        setFilteredQuotes(filtered);
        setCurrentPage(1); // Reset to first page after filtering
    };

    return (
        <div className="flex flex-col w-3/4">
            <div className="grid gap-4">
                {paginatedQuotes.map((quote, index) => (
                    <ListingCard key={index} quote={quote} />
                ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
};