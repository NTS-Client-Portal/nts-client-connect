import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface SidebarProps {
    onSearch: (filters: Record<string, string | number | null>) => void;
}

export const SideBar: React.FC<SidebarProps> = ({ onSearch }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [company, setCompany] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [trailerType, setTrailerType] = useState('');
    const [vehicleStatus, setVehicleStatus] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const handleSearch = () => {
        onSearch({
            origin,
            destination,
            minPrice: minPrice || null,
            maxPrice: maxPrice || null,
            company,
            vehicleType,
            trailerType,
            vehicleStatus,
        });
    };

    return (
        <div className="w-1/5 flex flex-col justify-center items-center bg-white border border-ntsLightBlue shadow-sm p-4 h-full">
            <h2 className="text-ntsBlue font-bold text-lg mb-4">Vehicle Search</h2>

            {/* Origin */}
            <div className='flex flex-col'>
                <label className="font-semibold text-ntsBlue text-start">Origin</label>
                <div className="relative mb-4">
                    <input
                        type="text"
                        className="w-full p-2 border rounded pr-10"
                        placeholder="Search origin..."
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                    />
                    <Search className="absolute right-2 top-1/3 h-4 text-ntsLightBlue" />
                </div>
            </div>

            {/* Destination */}
            <div className='flex flex-col'>
                <label className="font-semibold text-ntsBlue text-start">Destination</label>
                <div className="relative mb-4">
                    <input
                        type="text"
                        className="w-full p-2 border border-ntsBlue/30 shadow rounded pr-10"
                        placeholder="Search destination..."
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />
                    <Search className="absolute right-2 top-1/3 h-4 text-ntsLightBlue" />
                </div>
            </div>

            {/* Search Filters Accordion */}
            <div className="w-full">
                <button
                    className="flex justify-center items-center w-full text-ntsLightBlue font-medium text-xl mb-2"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <span>Search Filters</span>
                    {filtersOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </button>
                {filtersOpen && (
                    <div className="flex flex-col items-center">
                        {/* Vehicle Type */}
                        <div className='flex flex-col w-3/4'>
                            <label className="font-semibold text-ntsBlue text-start">Vehicle Type</label>
                            <select
                                className="mb-4 bg-zinc-50 p-2 border border-ntsBlue/30 rounded"
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                            >
                                <option value="">Select Vehicle Type</option>
                                <option value="Boat">Boat</option>
                                <option value="Car">Car</option>
                                <option value="RV">RV</option>
                                <option value="Heavy Equipment">Heavy Equipment</option>
                                <option value="Motorcycle">Motorcycle</option>
                                <option value="Van">Van</option>
                                <option value="Pickup">Pickup</option>
                                <option value="SUV">SUV</option>
                                <option value="Travel Trailer">Travel Trailer</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Trailer Type */}
                        <div className='flex flex-col w-3/4'>
                            <label className="font-semibold text-ntsBlue text-start">Trailer Type</label>
                            <select
                                className="mb-4 p-2 bg-zinc-50 border border-ntsBlue/30 rounded"
                                value={trailerType}
                                onChange={(e) => setTrailerType(e.target.value)}
                            >
                                <option value="">Select Trailer Type</option>
                                <option value="Open">Open</option>
                                <option value="Enclosed">Enclosed</option>
                                <option value="Driveaway">Driveaway</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className='flex flex-col w-3/4'>
                            <label className="font-semibold text-ntsBlue text-start">Vehicle Status</label>
                            <select
                                className="mb-4 p-2 bg-zinc-50 border border-ntsBlue/30 rounded"
                                value={vehicleStatus}
                                onChange={(e) => setVehicleStatus(e.target.value)}
                            >
                                <option value="">Select Vehicle Status</option>
                                <option value="Operable">Operable</option>
                                <option value="Inoperable">Inoperable</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleSearch}
                className="border-2 font-semibold border-ntsLightBlue text-ntsLightBlue w-2/3 py-2 rounded hover:bg-ntsLightBlue transition"
            >
                Search
            </button>
        </div>
    );
};

export default SideBar;