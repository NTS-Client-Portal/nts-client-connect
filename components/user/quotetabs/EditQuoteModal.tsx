import React, { useState, useEffect } from 'react';
import { ShippingQuote } from '@/lib/schema';
import EditHistory from '../../EditHistory';
import axios from 'axios';

interface EditQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuote: ShippingQuote) => void;
    quote: ShippingQuote | null;
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ isOpen, onClose, onSubmit, quote }) => {
    const [updatedQuote, setUpdatedQuote] = useState<ShippingQuote | null>(quote);
    const [originZip, setOriginZip] = useState('');
    const [originInput, setOriginInput] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [errorText, setErrorText] = useState<string>('');
    const [destinationInput, setDestinationInput] = useState('');

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

    const handleZipCodeBlur = async () => {
        if (originInput.match(/^\d{5}$/)) {
            // Input is a zip code
            try {
                const response = await axios.get(`https://api.zippopotam.us/us/${originInput}`);
                if (response.status === 200) {
                    const data = response.data;
                    const city = data.places[0]['place name'];
                    const state = data.places[0]['state abbreviation'];
                    setOriginCity(city);
                    setOriginState(state);
                    setOriginZip(originInput);
                    setOriginInput(`${city}, ${state} ${originInput}`);
                }
            } catch (error) {
                console.error('Error fetching city and state:', error);
            }
        } else {
            // Input is a city and state
            const [city, state] = originInput.split(',').map((str) => str.trim());
            if (city && state) {
                try {
                    const response = await axios.get(`https://api.zippopotam.us/us/${state}/${city}`);
                    if (response.status === 200) {
                        const data = response.data;
                        const zip = data.places[0]['post code'];
                        setOriginCity(city);
                        setOriginState(state);
                        setOriginZip(zip);
                        setOriginInput(`${city}, ${state} ${zip}`);
                    }
                } catch (error) {
                    console.error('Error fetching zip code:', error);
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
                        <div className='flex gap-3 mt-2'>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.year || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.make || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.model || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                        </div>
                        <div className='flex gap-3 mt-2'>
                            <div className="flex flex-col justify-center items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Length</label>
                                <input
                                    type="text"
                                    name="length"
                                    value={updatedQuote.length || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <select
                                    className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                    name="length_unit"
                                    value={updatedQuote.length_unit || 'ft'}
                                    onChange={handleChange}
                                >
                                    <option value="ft">Feet</option>
                                    <option value="in">Inches</option>
                                </select>
                            </div>
                            <div className="flex flex-col justify-center items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Width</label>
                                <input
                                    type="text"
                                    name="width"
                                    value={updatedQuote.width || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <select className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                    name="width_unit"
                                    value={updatedQuote.width_unit || 'ft'}
                                    onChange={handleChange}
                                >
                                    <option value="ft">Feet</option>
                                    <option value="in">Inches</option>
                                </select>
                            </div>
                            <div className="flex flex-col justify-center items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Height</label>
                                <input
                                    type="text"
                                    name="height"
                                    value={updatedQuote.height || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <select className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                    name="height_unit"
                                    value={updatedQuote.height_unit || 'ft'}
                                    onChange={handleChange}
                                >
                                    <option value="ft">Feet</option>
                                    <option value="in">Inches</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Operational Condition</label>
                            <select
                                name="operational_condition"
                                value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'operable' : 'inoperable'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'operable' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
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
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Tarping</label>
                            <select
                                name="tarping"
                                value={updatedQuote.tarping === null ? '' : updatedQuote.tarping ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className='flex gap-3 items-center'>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Auction</label>
                                <input
                                    type="text"
                                    name="auction"
                                    value={updatedQuote.auction || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Buyer Number</label>
                                <input
                                    type="text"
                                    name="buyer_number"
                                    value={updatedQuote.buyer_number || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                                <input
                                    type="text"
                                    name="lot_number"
                                    value={updatedQuote.lot_number || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                        </div>
                        <div className='mb-4'>
                            <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={updatedQuote.due_date || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
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
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Container Type</label>
                            <input
                                type="text"
                                name="container_type"
                                value={updatedQuote.container_type || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Contents Description</label>
                            <input
                                type="text"
                                name="contents_description"
                                value={updatedQuote.contents_description || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination Surface Type</label>
                            <input
                                type="text"
                                name="destination_surface_type"
                                value={updatedQuote.destination_surface_type || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Destination Type</label>
                            <select
                                name="destination_type"
                                value={updatedQuote.destination_type === null ? '' : updatedQuote.destination_type ? 'Business' : 'Residential'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'Business' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
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
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Is Loaded</label>
                            <select
                                name="is_loaded"
                                value={updatedQuote.is_loaded === null ? '' : updatedQuote.is_loaded ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
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
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
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
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Origin Type</label>
                            <select
                                name="origin_type"
                                value={updatedQuote.origin_type === null ? '' : updatedQuote.origin_type ? 'Business' : 'Residential'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'Business' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="">Select...</option>
                                <option value="Business">Business</option>
                                <option value="Residential">Residential</option>
                            </select>
                        </div>
                    </>
                );
            case 'Boats':
                return (
                    <>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Year</label>
                            <input
                                type='text'
                                name='year'
                                value={updatedQuote.year || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Make</label>
                            <input
                                type='text'
                                name='make'
                                value={updatedQuote.make || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Model</label>
                            <input
                                type='text'
                                name='model'
                                value={updatedQuote.model || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Length</label>
                            <input
                                type='text'
                                name='length'
                                value={updatedQuote.length || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Beam</label>
                            <input
                                type='text'
                                name='width'
                                value={updatedQuote.width || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Height</label>
                            <input
                                type='text'
                                name='height'
                                value={updatedQuote.height || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                    </>
                );
            case 'LTL/FTL':
                return (
                    <>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Commodity</label>
                            <input
                                type='text'
                                name='commodity'
                                value={updatedQuote.commodity || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='block mb-4'>
                            <label className='block text-sm font-medium text-gray-700'>Packaging</label>
                            <input
                                type='text'
                                name='packaging'
                                value={updatedQuote.packaging_type || ''}
                                onChange={handleChange}
                                className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                            />
                        </div>
                        <div className='flex gap-1 justify-center items-center'>
                            <div className="flex flex-col gap-1 items-center">
                                <label className="block text-sm font-medium text-gray-700">Length</label>
                                <input
                                    type="number"
                                    name="length"
                                    value={updatedQuote.length || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <select className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                    name="length_unit"
                                    value={updatedQuote.length_unit || 'ft'}
                                    onChange={handleChange}
                                >
                                    <option value='in'>Inches</option>
                                    <option value='ft'>Feet</option>
                                    <option value='m'>Meters</option>
                                    <option value='mm'>Millimeters</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 items-center">
                                <label className="block text-sm font-medium text-gray-700">Width</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={updatedQuote.width || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <select className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                    name="width_unit"
                                    value={updatedQuote.width_unit || 'ft'}
                                    onChange={handleChange}
                                >
                                    <option value='in'>Inches</option>
                                    <option value='ft'>Feet</option>
                                    <option value='m'>Meters</option>
                                    <option value='mm'>Millimeters</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 items-center">
                                <label className="block text-sm font-medium text-gray-700">Height</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={updatedQuote.height || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <select
                                    name="height_unit"
                                    value={updatedQuote.height_unit || 'ft'}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                >
                                    <option value='in'>Inches</option>
                                    <option value='ft'>Feet</option>
                                    <option value='m'>Meters</option>
                                    <option value='mm'>Millimeters</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 items-center">
                                <label className="block text-sm font-medium text-gray-700">Weight Per Unit</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={updatedQuote.weight || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                                <label className="block text-sm font-medium text-gray-700">Weight Unit</label>
                                <select
                                    name="weight_unit"
                                    value={updatedQuote.weight_unit || 'lbs'}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                >
                                    <option value="lbs">lbs</option>
                                    <option value="tons">tons</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Freight Class</label>
                            <input
                                type="text"
                                name="freight_class"
                                value={updatedQuote.freight_class || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Lift Gate</label>
                            <select
                                name="loading_assistance"
                                value={updatedQuote.loading_assistance || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="">Select...</option>
                                <option value="At Origin">At Origin</option>
                                <option value="At Destination">At Destination</option>
                                <option value="Both Origin and Destination">Both Origin and Destination</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Dock / No Dock</label>
                            <select
                                name="dock_no_dock"
                                value={updatedQuote.dock_no_dock || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="">Select...</option>
                                <option value="At Origin">At Origin</option>
                                <option value="At Destination">At Destination</option>
                            </select>
                        </div>
                    </>
                );
            case 'Trailers':
                return (
                    <div className='flex gap-1 justify-center items-center'>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Length</label>
                            <input
                                type="text"
                                name="length"
                                value={updatedQuote.length || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                            <select
                                name="length_unit"
                                value={updatedQuote.length_unit || 'ft'}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value='ft'>Feet</option>
                                <option value='in'>Inches</option>
                                <option value='m'>Meters</option>
                                <option value='mm'>Millimeters</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Width</label>
                            <input
                                type="text"
                                name="width"
                                value={updatedQuote.width || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                            <select
                                name="width_unit"
                                value={updatedQuote.width_unit || 'ft'}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value='ft'>Feet</option>
                                <option value='in'>Inches</option>
                                <option value='m'>Meters</option>
                                <option value='mm'>Millimeters</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Height</label>
                            <input
                                type="text"
                                name="height"
                                value={updatedQuote.height || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                            <select
                                name="height_unit"
                                value={updatedQuote.height_unit || 'ft'}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value='ft'>Feet</option>
                                <option value='in'>Inches</option>
                                <option value='m'>Meters</option>
                                <option value='mm'>Millimeters</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Weight</label>
                            <input
                                type="text"
                                name="weight"
                                value={updatedQuote.weight || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                            <label className="block text-sm font-medium text-gray-700">Weight Unit</label>
                            <select
                                name="weight_unit"
                                value={updatedQuote.weight_unit || 'lbs'}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="lbs">lbs</option>
                                <option value="tons">tons</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                            </select>
                        </div>

                    </div>
                )
            case 'Auto':
                return (
                    <div>
                        <div className='flex gap-1 justify-center items-center mt-4 '>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.auto_year || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.auto_make || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.auto_model || ''}
                                    onChange={handleChange}
                                    className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">VIN</label>
                            <input
                                type="text"
                                name="vin"
                                value={updatedQuote.vin || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Operational Condition</label>
                            <select
                                name="operational_condition"
                                value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'operable' : 'inoperable'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'operable' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="">Select...</option>
                                <option value="operable">Operable</option>
                                <option value="inoperable">Inoperable</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Running</label>
                            <select
                                name="running"
                                value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={updatedQuote.due_date || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                name="notes"
                                value={updatedQuote.notes || ''}
                                onChange={handleChange}
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                            />
                        </div>

                    </div>
                )
            default:
                return null;
        }
    };

    if (!isOpen || !updatedQuote) return null;

    return (
        <div className="fixed inset-0 flex overflow-y-auto  items-center justify-center bg-black bg-opacity-50">
            <div className="relative z-50 flex mt-10 md:mt-0 gap-2 bg-white h-[90vh] md:h-4/5 overflow-y-auto p-4 rounded shadow-lg w-[98vw] md:w-fit">
                <form className='border-r px-2 ' onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold mb-4">Edit Quote</h2>
                    <div className='flex flex-col md:flex-row gap-2 w-full'>
                        <div className='flex flex-col items-start'>
                            <label className='text-zinc-900 font-medium'>Origin</label>
                            <input
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Zip or City, State'
                                value={originInput}
                                onChange={(e) => setOriginInput(e.target.value)}
                                onBlur={handleZipCodeBlur}
                            />

                            <input type="hidden" value={originCity} />
                            <input type="hidden" value={originState} />
                            <input type="hidden" value={originZip} />
                        </div>
                        <div className='flex flex-col items-start'>
                            <label className='text-zinc-900 font-medium'>Destination</label>
                            <input
                                className="rounded w-full p-1 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Zip or City, State'
                                value={destinationInput}
                                onChange={(e) => setDestinationInput(e.target.value)}
                                onBlur={handleZipCodeBlur}
                            />

                            <input type="hidden" value={destinationCity} />
                            <input type="hidden" value={destinationState} />
                            <input type="hidden" value={destinationZip} />
                        </div>
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700'>Requested Shipping Date</label>
                        <input
                            type='date'
                            name='due_date'
                            value={updatedQuote.due_date || ''}
                            onChange={handleChange}
                            className='rounded w-full p-1 border border-zinc-900/30 shadow-md'
                        />
                    </div>
                    {renderInputFields()}
                    <div className="flex justify-end py-4">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                            Save
                        </button>
                    </div>
                </form>
                {/* <EditHistory quoteId={quote?.id || 0} searchTerm="" searchColumn="id" editHistory={[]} /> */}
            </div>
        </div>
    );
};

export default EditQuoteModal;