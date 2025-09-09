export const freightTypeMapping: { [key: string]: string } = {
    equipment: 'Equipment/Machinery',
    containers: 'Containers',
    rv_trailers: 'RV/Trailers',
    semi_trucks: 'Semi Trucks',
    boats: 'Boats',
    ltl_ftl: 'LTL/FTL',
    freight: 'Freight',
    // New subcategory mappings
    LTL: 'LTL (Less Than Truckload)',
    FTL: 'FTL (Full Truckload)',
    Flatbed: 'Flatbed',
    Reefer: 'Reefer (Temperature-Controlled)',
    'Dry Van': 'Dry Van',
    'Other': 'Other/Specialty',
};

export const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${month}/${day}/${year}`; // US format: MM/DD/YYYY
};

export const renderAdditionalDetails = (quote: any) => {
    switch (quote.freight_type) {
        case 'Equipment':
            return (
                <>
                    <div className="grid grid-cols-3">
                        <div className="flex flex-col justify-around gap-1">
                            <div className="flex flex-col">
                            <h3 className="text-zinc-800 font-bold text-lg">Equipment Details:</h3>
                                <div><strong>Year:</strong> {quote.year}</div>
                                <div><strong>Make:</strong> {quote.make}</div>
                                <div><strong>Model:</strong> {quote.model}</div>
                          
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-zinc-800 font-bold text-lg mt-1">Shipment Details</h3>
                                <div><span className="font-semibold text-zinc-700">Pick Up:</span> {quote.due_date}</div>
                                <div className="flex gap-1">
                                    <div><span className="font-semibold text-zinc-700">Height:</span> {quote.height}&apos; </div>
                                    <div><span className="font-semibold text-zinc-700">Length:</span> {quote.length}&apos;</div>
                                    <div><span className="font-semibold text-zinc-700">Width:</span> {quote.width}&apos;</div>
                                </div>
                                <div><span className="font-semibold text-zinc-700">Weight:</span> {quote.weight} lbs</div>
                                <div><span className="font-semibold text-zinc-700">Condition:</span> {quote.operational_condition ? 'Operable' : 'Inoperable'}</div>
                                <div><span className="font-semibold text-zinc-700">Loading/Unloading Requirements:</span> {quote.loading_unloading_requirements}</div>
                                <div><span className="font-semibold text-zinc-700">Tarping:</span> {quote.tarping ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-start gap-8"> 
                        <div className="flex flex-col items-start w-fit text-nowrap">
                                  <h3 className="text-zinc-800 font-bold text-lg mb-1">Route Details</h3>
                                        <div><span className="font-semibold text-zinc-700">Origin:</span> {quote.origin_city}, {quote.origin_state} {quote.origin_zip}</div>
                                        <div><span className="font-semibold text-zinc-700">Destination:</span> {quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
                                </div>
                            <div className="flex flex-col">
                                <h3 className="text-zinc-800 font-bold text-lg">Additional Details:</h3>
                                <div><span className="font-semibold text-zinc-700">Special Instructions:</span> {quote.special_instructions}</div>
                                <div><span className="font-semibold text-zinc-700">Additional Information:</span> {quote.additional_information}</div>
                            </div>                     

                        </div>
                        <div className="flex flex-col justify-start">
                            <div className="flex flex-col w-fit text-nowrap">                            
                                    <h3 className="text-zinc-800 font-bold text-lg mb-1">Auction/Dealer Details:</h3>
                                    <div><span className="font-semibold text-zinc-700">Auction:</span> {quote.auction}</div>
                                    <div><span className="font-semibold text-zinc-700">Buyer Number:</span> {quote.buyer_number}</div>
                                    <div><span className="font-semibold text-zinc-700">Lot Number:</span> {quote.lot_number}</div>
                            </div>  
                        </div>
                    </div>
                </>
            );
        case 'Containers':
            return (
                <>
                    <div className="grid grid-cols-3">
                        <div className="flex flex-col justify-start">
                            <h3 className="text-zinc-800 font-bold text-lg">Container Details:</h3>
                            <div><span  className="font-semibold text-zinc-700">Container Length:</span> {quote.container_length}</div>
                            <div><span  className="font-semibold text-zinc-700">Container Type:</span> {quote.container_type}</div>
                            <div><span  className="font-semibold text-zinc-700">Contents Description:</span> {quote.contents_description}</div>
                            <div><span  className="font-semibold text-zinc-700">Goods Value:</span> {quote.goods_value}</div>
                        </div>
                        
                        <div className="">
                            <h3 className="text-zinc-800 font-bold text-lg">Shipment Details:</h3>
                            <div><span  className="font-semibold text-zinc-700">Loading By:</span> {quote.loading_by ? 'Yes' : 'No'}</div>
                            <div><span  className="font-semibold text-zinc-700">Origin Surface Type:</span> {quote.origin_surface_type}</div>
                            <div><span  className="font-semibold text-zinc-700">Origin Type:</span> {quote.origin_type ? 'Business' : 'Residential'}</div>
                            <div><span  className="font-semibold text-zinc-700">Destination Type:</span> {quote.destination_type ? 'Business' : 'Residential'}</div>
                            <div><span  className="font-semibold text-zinc-700">Destination Surface Type:</span> {quote.destination_surface_type}</div>
                        </div>
                    </div>
                </>
            );
        case 'Trailers':
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
        case 'Semi/Heavy Duty Trucks':
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
        case 'Boats':
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
        case 'LTL/FTL':
        case 'Freight':
            return (
                <>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <h3 className="text-zinc-800 font-bold text-lg">Freight Details:</h3>
                            <div><strong>Freight Type:</strong> {quote.freight_type}</div>
                            <div><strong>Load Description:</strong> {quote.commodity}</div>
                            <div><strong>Packaging Type:</strong> {quote.packaging_type}</div>
                            <div><strong>Freight Class:</strong> {quote.freight_class || 'Not specified'}</div>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-zinc-800 font-bold text-lg">Dimensions & Weight:</h3>
                            <div className="flex gap-4">
                                <div><strong>L:</strong> {quote.length}{quote.length_unit || 'ft'}</div>
                                <div><strong>W:</strong> {quote.width}{quote.width_unit || 'ft'}</div>
                                <div><strong>H:</strong> {quote.height}{quote.height_unit || 'ft'}</div>
                            </div>
                            <div><strong>Weight:</strong> {quote.weight} {quote.weight_unit || 'lbs'}</div>
                            <div><strong>Value:</strong> {quote.goods_value || 'Not specified'}</div>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-zinc-800 font-bold text-lg">Requirements:</h3>
                            <div><strong>Loading Assistance:</strong> {quote.loading_assistance || 'Not specified'}</div>
                            <div><strong>Dock Available:</strong> {quote.dock_no_dock || 'Not specified'}</div>
                            {quote.weight_per_pallet_unit && (
                                <div><strong>Weight per Unit:</strong> {quote.weight_per_pallet_unit}</div>
                            )}
                        </div>
                    </div>
                    
                    {/* Temperature Requirements for Reefer Freight */}
                    {(quote.temperature_range || quote.temperature_instructions) && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                                <span className="text-blue-600">❄️</span>
                                Temperature Control Requirements
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quote.temperature_range && (
                                    <div>
                                        <strong className="text-blue-800">Temperature Range:</strong>
                                        <span className="ml-2">{quote.temperature_range}</span>
                                    </div>
                                )}
                                {quote.temperature_instructions && (
                                    <div>
                                        <strong className="text-blue-800">Special Instructions:</strong>
                                        <span className="ml-2">{quote.temperature_instructions}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            );
        case 'Auto':
            return (
                <>
                    <div><strong>Year:</strong> {quote.auto_year}</div>
                    <div><strong>Make:</strong> {quote.auto_make}</div>
                    <div><strong>Model:</strong> {quote.auto_model}</div>
                    <div><span className="font-semibold text-zinc-900">Condition:</span> {quote.operational_condition ? 'Operable' : 'Inoperable'}</div>
                    <div><strong>Value:</strong> {quote.value || 'N/A'}</div>
                    <div><strong>VIN:</strong> {quote.vin || 'N/A'}</div>
                </>
            );
        default:
            return null;
    }
};