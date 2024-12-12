import React from 'react';
import { Database } from '@/lib/database.types'; // Adjust the import path as needed

interface QuoteDetailsMobileProps {
    quote: Database['public']['Tables']['shippingquotes']['Row'];
    formatDate: (dateString: string | null) => string;
    archiveQuote: (id: number) => void;
    handleEditClick: (quote: Database['public']['Tables']['shippingquotes']['Row']) => void;
    handleCreateOrderClick: (id: number) => void;
    handleRespond: (id: number) => void;
    isAdmin: boolean;
}

const QuoteDetailsMobile: React.FC<QuoteDetailsMobileProps> = ({
    quote,
    formatDate,
    archiveQuote,
    handleEditClick,
    handleCreateOrderClick,
    handleRespond,
    isAdmin,
}) => {
    const details = [];

    switch (quote.freight_type) {
        case 'equipment':
            if (quote.year) details.push(<div key="year"><strong>Year:</strong> {quote.year}</div>);
            if (quote.make) details.push(<div key="make"><strong>Make:</strong> {quote.make}</div>);
            if (quote.model) details.push(<div key="model"><strong>Model:</strong> {quote.model}</div>);
            if (quote.operational_condition !== null) details.push(<div key="operational_condition"><strong>Operational Condition:</strong> {quote.operational_condition ? 'Operable' : 'Inoperable'}</div>);
            if (quote.loading_unloading_requirements) details.push(<div key="loading_unloading_requirements"><strong>Loading/Unloading Requirements:</strong> {quote.loading_unloading_requirements}</div>);
            if (quote.tarping !== null) details.push(<div key="tarping"><strong>Tarping:</strong> {quote.tarping ? 'Yes' : 'No'}</div>);
            if (quote.auction) details.push(<div key="auction"><strong>Auction:</strong> {quote.auction}</div>);
            if (quote.buyer_number) details.push(<div key="buyer_number"><strong>Buyer Number:</strong> {quote.buyer_number}</div>);
            if (quote.lot_number) details.push(<div key="lot_number"><strong>Lot Number:</strong> {quote.lot_number}</div>);
            break;
        case 'containers':
            if (quote.container_length) details.push(<div key="container_length"><strong>Container Length:</strong> {quote.container_length}</div>);
            if (quote.container_type) details.push(<div key="container_type"><strong>Container Type:</strong> {quote.container_type}</div>);
            if (quote.contents_description) details.push(<div key="contents_description"><strong>Contents Description:</strong> {quote.contents_description}</div>);
            if (quote.destination_surface_type) details.push(<div key="destination_surface_type"><strong>Destination Surface Type:</strong> {quote.destination_surface_type}</div>);
            if (quote.destination_type !== null) details.push(<div key="destination_type"><strong>Destination Type:</strong> {quote.destination_type ? 'Business' : 'Residential'}</div>);
            if (quote.goods_value) details.push(<div key="goods_value"><strong>Goods Value:</strong> {quote.goods_value}</div>);
            if (quote.is_loaded !== null) details.push(<div key="is_loaded"><strong>Is Loaded:</strong> {quote.is_loaded ? 'Yes' : 'No'}</div>);
            if (quote.loading_by !== null) details.push(<div key="loading_by"><strong>Loading By:</strong> {quote.loading_by ? 'Yes' : 'No'}</div>);
            if (quote.origin_surface_type) details.push(<div key="origin_surface_type"><strong>Origin Surface Type:</strong> {quote.origin_surface_type}</div>);
            if (quote.origin_type !== null) details.push(<div key="origin_type"><strong>Origin Type:</strong> {quote.origin_type ? 'Business' : 'Residential'}</div>);
            break;
        case 'rv_trailers':
            if (quote.class_type) details.push(<div key="class_type"><strong>Class Type:</strong> {quote.class_type}</div>);
            if (quote.make) details.push(<div key="make"><strong>Make:</strong> {quote.make}</div>);
            if (quote.model) details.push(<div key="model"><strong>Model:</strong> {quote.model}</div>);
            if (quote.motorized_or_trailer) details.push(<div key="motorized_or_trailer"><strong>Motorized or Trailer:</strong> {quote.motorized_or_trailer}</div>);
            if (quote.roadworthy !== null) details.push(<div key="roadworthy"><strong>Roadworthy:</strong> {quote.roadworthy ? 'Yes' : 'No'}</div>);
            if (quote.vin) details.push(<div key="vin"><strong>VIN:</strong> {quote.vin}</div>);
            if (quote.year) details.push(<div key="year"><strong>Year:</strong> {quote.year}</div>);
            break;
        case 'semi_trucks':
            if (quote.driveaway_or_towaway !== null) details.push(<div key="driveaway_or_towaway"><strong>Driveaway or Towaway:</strong> {quote.driveaway_or_towaway ? 'Driveaway' : 'Towaway'}</div>);
            if (quote.height) details.push(<div key="height"><strong>Height:</strong> {quote.height}</div>);
            if (quote.length) details.push(<div key="length"><strong>Length:</strong> {quote.length}</div>);
            if (quote.make) details.push(<div key="make"><strong>Make:</strong> {quote.make}</div>);
            if (quote.model) details.push(<div key="model"><strong>Model:</strong> {quote.model}</div>);
            if (quote.vin) details.push(<div key="vin"><strong>VIN:</strong> {quote.vin}</div>);
            if (quote.weight) details.push(<div key="weight"><strong>Weight:</strong> {quote.weight}</div>);
            if (quote.width) details.push(<div key="width"><strong>Width:</strong> {quote.width}</div>);
            if (quote.year) details.push(<div key="year"><strong>Year:</strong> {quote.year}</div>);
            break;
        case 'boats':
            if (quote.beam) details.push(<div key="beam"><strong>Beam:</strong> {quote.beam}</div>);
            if (quote.cradle !== null) details.push(<div key="cradle"><strong>Cradle:</strong> {quote.cradle ? 'Yes' : 'No'}</div>);
            if (quote.height) details.push(<div key="height"><strong>Height:</strong> {quote.height}</div>);
            if (quote.length) details.push(<div key="length"><strong>Length:</strong> {quote.length}</div>);
            if (quote.trailer !== null) details.push(<div key="trailer"><strong>Trailer:</strong> {quote.trailer ? 'Yes' : 'No'}</div>);
            if (quote.type) details.push(<div key="type"><strong>Type:</strong> {quote.type}</div>);
            if (quote.weight) details.push(<div key="weight"><strong>Weight:</strong> {quote.weight}</div>);
            break;
        case 'ltl_ftl':
            if (quote.load_description) details.push(<div key="load_description"><strong>Load Description:</strong> {quote.load_description}</div>);
            if (quote.freight_class) details.push(<div key="freight_class"><strong>Freight Class:</strong> {quote.freight_class}</div>);
            if (quote.loading_assistance) details.push(<div key="loading_assistance"><strong>Loading Assistance:</strong> {quote.loading_assistance}</div>);
            if (quote.packaging_type) details.push(<div key="packaging_type"><strong>Packaging Type:</strong> {quote.packaging_type}</div>);
            if (quote.weight_per_pallet_unit) details.push(<div key="weight_per_pallet_unit"><strong>Weight per Pallet/Unit:</strong> {quote.weight_per_pallet_unit}</div>);
            if (quote.dock_no_dock !== null) details.push(<div key="dock_no_dock"><strong>Dock / No Dock:</strong> {quote.dock_no_dock ? 'Dock' : 'No Dock'}</div>);
            break;
        default:
            return null;
    }

    return (
        <div className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md mb-4 p-4 border border-zinc-400">
            <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">ID</div>
                <div className="text-sm text-zinc-900">{quote.id}</div>
            </div>
            <div className='border-b border-zinc-600 mb-4'></div>
            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Origin</div>
                <div className="text-sm font-medium text-zinc-900">{quote.origin_city}, {quote.origin_state} {quote.origin_zip}</div>
            </div>
            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Destination</div>
                <div className="text-sm font-medium text-zinc-900">{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
            </div>
            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Freight</div>
                <div className="text-sm font-medium text-zinc-900">{quote.year} {quote.make} {quote.model} <br />Freight Type: {quote.freight_type}</div>
            </div>
            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Dimensions</div>
                <div className="text-sm font-medium text-zinc-900">{quote.length}&apos; {quote.width}&apos; {quote.height}&apos; <br />{quote.weight} lbs</div>
            </div>
            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Shipping Date</div>
                <div className="text-sm font-medium text-zinc-900">{formatDate(quote.due_date)}</div>
            </div>
            <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Price</div>
                <div className="text-sm font-medium text-zinc-900">{quote.price ? `$${quote.price}` : 'Quote Pending'}</div>
            </div>
            {details.length > 0 && <div className="mt-4">{details}</div>}
            <div className="flex justify-between items-center">
                <button onClick={() => archiveQuote(quote.id)} className="text-red-500 ml-2">
                    Archive
                </button>
                <button
                    onClick={() => handleEditClick(quote)}
                    className="body-btn"
                >
                    Edit
                </button>
                {quote.price ? (
                    <button
                        onClick={() => handleCreateOrderClick(quote.id)}
                        className="ml-2 p-1 body-btn text-white rounded"
                    >
                        Create Order
                    </button>
                ) : (
                    <button
                        onClick={() => handleEditClick(quote)}
                        className="upload-btn"
                    >
                        Edit
                    </button>
                )}
                {isAdmin && (
                    <button onClick={() => handleRespond(quote.id)} className="text-blue-500 ml-2">
                        Respond
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuoteDetailsMobile;