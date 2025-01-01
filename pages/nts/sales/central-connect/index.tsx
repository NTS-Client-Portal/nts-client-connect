// src/App.tsx
import React, { useState } from 'react';
import { ListingsContainer } from '@/components/central/ListingContainer'
import { SideBar } from '@/components/central/SideBar'
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

const mockData = [
    {
        year: '1999',
        make: 'Caterpillar',
        model: 'D8r',
        price: 6000,
        price_per_mile: 2.65,
        total_miles: 2264,
        origin_city: 'Nisku',
        origin_state: 'AB',
        destination_city: 'Houston',
        destination_state: 'TX',
        earliest_pickup_date: '12/30/24',
        due_date: '12/30/24',
        company_name: 'Ampersand Transport LLC',
        company_phone: '856-492-4700',
        hours: 'M-F 8-7 EST',
        rating: {
            overall: 4.8,
            reviews_count: 306,
            old_system_rating: 100,
            old_system_reviews: 29,
        },
        additional_info: 'Call or text Mary Fadden',
        additional_phone: '856-807-5201',
    },
    // Add more items as needed
];

const CentralPage: React.FC = () => {
    const [filteredData, setFilteredData] = useState(mockData);

    const handleSearch = (filters: Record<string, string | number | null>) => {
        const filtered = mockData.filter((item) => {
            const matchesOrigin = filters.origin ? item.origin_city?.toLowerCase().includes(filters.origin.toString().toLowerCase()) : true;
            const matchesDestination = filters.destination ? item.destination_city?.toLowerCase().includes(filters.destination.toString().toLowerCase()) : true;
            const matchesPrice =
                filters.minPrice || filters.maxPrice
                    ? item.price >= (Number(filters.minPrice) || 0) && item.price <= (Number(filters.maxPrice) || Infinity)
                    : true;
            const matchesCompany = filters.company ? item.company_name?.toLowerCase().includes(filters.company.toString().toLowerCase()) : true;
            return matchesOrigin && matchesDestination && matchesPrice && matchesCompany;
        });

        setFilteredData(filtered);
    };

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <div className="flex mt-4 gap-2">
                    <SideBar onSearch={handleSearch} />
                    <ListingsContainer quotes={filteredData} />
                </div>
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default CentralPage;
