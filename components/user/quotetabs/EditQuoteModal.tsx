import React, { useState, useEffect } from 'react';
import { ShippingQuote } from '@/lib/schema';
import EditHistory from '../../EditHistory';

interface EditQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuote: ShippingQuote) => void;
    quote: ShippingQuote | null;
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ isOpen, onClose, onSubmit, quote }) => {
    const [updatedQuote, setUpdatedQuote] = useState<ShippingQuote | null>(quote);
    const [originZip, setOriginZip] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');

    useEffect(() => {
        if (quote) {
            setUpdatedQuote(quote);
            setOriginZip(quote.origin_zip || '');
            setOriginCity(quote.origin_city || '');
            setOriginState(quote.origin_state || '');
            setDestinationZip(quote.destination_zip || '');
            setDestinationCity(quote.destination_city || '');
            setDestinationState(quote.destination_state || '');
        }
    }, [quote]);

    const handleZipCodeBlur = async (type: 'origin' | 'destination') => {
        const zipCode = type === 'origin' ? originZip : destinationZip;
        if (zipCode.length === 5) {
            try {
                const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
                if (response.ok) {
                    const data = await response.json();
                    const city = data.places[0]['place name'];
                    const state = data.places[0]['state abbreviation'];
                    if (type === 'origin') {
                        setOriginCity(city);
                        setOriginState(state);
                        setUpdatedQuote((prev) => prev ? { ...prev, origin_city: city, origin_state: state } : null);
                    } else {
                        setDestinationCity(city);
                        setDestinationState(state);
                        setUpdatedQuote((prev) => prev ? { ...prev, destination_city: city, destination_state: state } : null);
                    }
                } else {
                    if (type === 'origin') {
                        setOriginCity('');
                        setOriginState('');
                    } else {
                        setDestinationCity('');
                        setDestinationState('');
                    }
                }
            } catch (error) {
                console.error('Error fetching city and state:', error);
                if (type === 'origin') {
                    setOriginCity('');
                    setOriginState('');
                } else {
                    setDestinationCity('');
                    setDestinationState('');
                }
            }
        }
    };

    useEffect(() => {
        setUpdatedQuote(quote);
    }, [quote]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (updatedQuote) {
            setUpdatedQuote({
                ...updatedQuote,
                [e.target.name]: e.target.value,
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatedQuote) {
            onSubmit(updatedQuote);
        }
    };

    const renderInputFields = () => {
        if (!updatedQuote) return null;

        switch (updatedQuote.freight_type) {
            case 'equipment':
                return (
                    <>
                        <div className='flex gap-3'>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.year || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.make || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.model || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Operational Condition</label>
                            <select
                                name="operational_condition"
                                value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'operable' : 'inoperable'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'operable' ? 'true' : 'false' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select...</option>
                                <option value="operable">Operable</option>
                                <option value="inoperable">Inoperable</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Loading/Unloading Requirements</label>
                            <input
                                type="text"
                                name="loading_unloading_requirements"
                                value={updatedQuote.loading_unloading_requirements || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Tarping</label>
                            <select
                                name="tarping"
                                value={updatedQuote.tarping === null ? '' : updatedQuote.tarping ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Auction</label>
                            <input
                                type="text"
                                name="auction"
                                value={updatedQuote.auction || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Buyer Number</label>
                            <input
                                type="text"
                                name="buyer_number"
                                value={updatedQuote.buyer_number || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                            <input
                                type="text"
                                name="lot_number"
                                value={updatedQuote.lot_number || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className='mb-4'>
                            <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={updatedQuote.due_date || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Notes</label>
                            <textarea
                                name='notes'
                                value={updatedQuote.notes || ''}
                                onChange={handleChange}
                                className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm' />
                        </div>
                    </>
                );
            case 'containers':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Container Length</label>
                            <input
                                type="number"
                                name="container_length"
                                value={updatedQuote.container_length || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Container Type</label>
                            <input
                                type="text"
                                name="container_type"
                                value={updatedQuote.container_type || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Contents Description</label>
                            <input
                                type="text"
                                name="contents_description"
                                value={updatedQuote.contents_description || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination Surface Type</label>
                            <input
                                type="text"
                                name="destination_surface_type"
                                value={updatedQuote.destination_surface_type || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination Type</label>
                            <select
                                name="destination_type"
                                value={updatedQuote.destination_type === null ? '' : updatedQuote.destination_type ? 'Business' : 'Residential'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'Business' ? 'true' : 'false' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select...</option>
                                <option value="Business">Business</option>
                                <option value="Residential">Residential</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Goods Value</label>
                            <input
                                type="text"
                                name="goods_value"
                                value={updatedQuote.goods_value || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Is Loaded</label>
                            <select
                                name="is_loaded"
                                value={updatedQuote.is_loaded === null ? '' : updatedQuote.is_loaded ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Loading By</label>
                            <select
                                name="loading_by"
                                value={updatedQuote.loading_by === null ? '' : updatedQuote.loading_by ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Origin Surface Type</label>
                            <input
                                type="text"
                                name="origin_surface_type"
                                value={updatedQuote.origin_surface_type || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Origin Type</label>
                            <select
                                name="origin_type"
                                value={updatedQuote.origin_type === null ? '' : updatedQuote.origin_type ? 'Business' : 'Residential'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'Business' ? 'true' : 'false' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select...</option>
                                <option value="Business">Business</option>
                                <option value="Residential">Residential</option>
                            </select>
                        </div>
                    </>
                );
            // Add more cases for other freight types as needed
            default:
                return null;
        }
    };

    if (!isOpen || !updatedQuote) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex gap-2 bg-white p-4 rounded shadow-lg w-fit">
                <form className='border border-r px-2 ' onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold mb-4">Edit Quote</h2>
                    <div className='flex gap-2'>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Origin Zipcode</label>
                            <input
                                type="text"
                                name="origin_zip"
                                value={originZip}
                                onChange={(e) => {
                                    setOriginZip(e.target.value);
                                    handleChange(e);
                                }}
                                onBlur={() => handleZipCodeBlur('origin')}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination Zipcode</label>
                            <input
                                type="text"
                                name="destination_zip"
                                value={destinationZip}
                                onChange={(e) => {
                                    setDestinationZip(e.target.value);
                                    handleChange(e);
                                }}
                                onBlur={() => handleZipCodeBlur('destination')}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Origin City</label>
                            <input
                                type="text"
                                name="origin_city"
                                value={originCity}
                                onChange={(e) => {
                                    setOriginCity(e.target.value);
                                    handleChange(e);
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Origin State</label>
                            <input
                                type="text"
                                name="origin_state"
                                value={originState}
                                onChange={(e) => {
                                    setOriginState(e.target.value);
                                    handleChange(e);
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination City</label>
                            <input
                                type="text"
                                name="destination_city"
                                value={destinationCity}
                                onChange={(e) => {
                                    setDestinationCity(e.target.value);
                                    handleChange(e);
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination State</label>
                            <input
                                type="text"
                                name="destination_state"
                                value={destinationState}
                                onChange={(e) => {
                                    setDestinationState(e.target.value);
                                    handleChange(e);
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    {renderInputFields()}
                    <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                            Save
                        </button>
                    </div>
                </form>
                <EditHistory quoteId={quote?.id || 0} searchTerm="" searchColumn="id" editHistory={[]} />
            </div>
        </div>
    );
};

export default EditQuoteModal;