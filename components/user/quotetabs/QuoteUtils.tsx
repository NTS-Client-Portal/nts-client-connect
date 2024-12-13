export const freightTypeMapping: { [key: string]: string } = {
    equipment: 'Equipment/Machinery',
    containers: 'Containers',
    rv_trailers: 'RV/Trailers',
    semi_trucks: 'Semi Trucks',
    boats: 'Boats',
    ltl_ftl: 'LTL/FTL',
};

export const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const renderAdditionalDetails = (quote: any) => {
    switch (quote.freight_type) {
        case 'equipment':
            return (
                <>
                    <div><strong>Year:</strong> {quote.year}</div>
                    <div><strong>Make:</strong> {quote.make}</div>
                    <div><strong>Model:</strong> {quote.model}</div>
                    <div><strong>Operational Condition:</strong> {quote.operational_condition ? 'Operable' : 'Inoperable'}</div>
                    <div><strong>Loading/Unloading Requirements:</strong> {quote.loading_unloading_requirements}</div>
                    <div><strong>Tarping:</strong> {quote.tarping ? 'Yes' : 'No'}</div>
                    <div><strong>Auction:</strong> {quote.auction}</div>
                    <div><strong>Buyer Number:</strong> {quote.buyer_number}</div>
                    <div><strong>Lot Number:</strong> {quote.lot_number}</div>
                </>
            );
        case 'containers':
            return (
                <>
                    <div><strong>Container Length:</strong> {quote.container_length}</div>
                    <div><strong>Container Type:</strong> {quote.container_type}</div>
                    <div><strong>Contents Description:</strong> {quote.contents_description}</div>
                    <div><strong>Destination Surface Type:</strong> {quote.destination_surface_type}</div>
                    <div><strong>Destination Type:</strong> {quote.destination_type ? 'Business' : 'Residential'}</div>
                    <div><strong>Goods Value:</strong> {quote.goods_value}</div>
                    <div><strong>Is Loaded:</strong> {quote.is_loaded ? 'Yes' : 'No'}</div>
                    <div><strong>Loading By:</strong> {quote.loading_by ? 'Yes' : 'No'}</div>
                    <div><strong>Origin Surface Type:</strong> {quote.origin_surface_type}</div>
                    <div><strong>Origin Type:</strong> {quote.origin_type ? 'Business' : 'Residential'}</div>
                </>
            );
        case 'rv_trailers':
            return (
                <>
                    <div><strong>Class Type:</strong> {quote.class_type}</div>
                    <div><strong>Make:</strong> {quote.make}</div>
                    <div><strong>Model:</strong> {quote.model}</div>
                    <div><strong>Motorized or Trailer:</strong> {quote.motorized_or_trailer}</div>
                    <div><strong>Roadworthy:</strong> {quote.roadworthy ? 'Yes' : 'No'}</div>
                    <div><strong>VIN:</strong> {quote.vin}</div>
                    <div><strong>Year:</strong> {quote.year}</div>
                </>
            );
        case 'semi_trucks':
            return (
                <>
                    <div><strong>Driveaway or Towaway:</strong> {quote.driveaway_or_towaway ? 'Driveaway' : 'Towaway'}</div>
                    <div><strong>Height:</strong> {quote.height}</div>
                    <div><strong>Length:</strong> {quote.length}</div>
                    <div><strong>Make:</strong> {quote.make}</div>
                    <div><strong>Model:</strong> {quote.model}</div>
                    <div><strong>VIN:</strong> {quote.vin}</div>
                    <div><strong>Weight:</strong> {quote.weight}</div>
                    <div><strong>Width:</strong> {quote.width}</div>
                    <div><strong>Year:</strong> {quote.year}</div>
                </>
            );
        case 'boats':
            return (
                <>
                    <div><strong>Beam:</strong> {quote.beam}</div>
                    <div><strong>Cradle:</strong> {quote.cradle ? 'Yes' : 'No'}</div>
                    <div><strong>Height:</strong> {quote.height}</div>
                    <div><strong>Length:</strong> {quote.length}</div>
                    <div><strong>Trailer:</strong> {quote.trailer ? 'Yes' : 'No'}</div>
                    <div><strong>Type:</strong> {quote.type}</div>
                    <div><strong>Weight:</strong> {quote.weight}</div>
                </>
            );
        case 'ltl_ftl':
            return (
                <>
                    <div><strong>Load Description:</strong> {quote.load_description}</div>
                    <div><strong>Freight Class:</strong> {quote.freight_class}</div>
                    <div><strong>Loading Assistance:</strong> {quote.loading_assistance}</div>
                    <div><strong>Packaging Type:</strong> {quote.packaging_type}</div>
                    <div><strong>Weight per Pallet/Unit:</strong> {quote.weight_per_pallet_unit}</div>
                    <div><strong>Dock / No Dock:</strong> {quote.dock_no_dock ? 'Dock' : 'No Dock'}</div>
                </>
            );
        default:
            return null;
    }
};