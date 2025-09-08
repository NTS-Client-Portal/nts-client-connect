import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShippingQuote } from '@/lib/schema';
import EditHistory from '../../EditHistory';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import axios from 'axios';

interface EditQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuote: ShippingQuote) => void;
    quote: ShippingQuote | null;
    isAdmin: boolean; // Whether the user is an NTS user (can make direct edits)
    session: any; // User session for identifying the requester
    companyId: string; // Company ID for the edit request
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    quote, 
    isAdmin, 
    session, 
    companyId 
}) => {
    const supabase = useSupabaseClient<Database>();
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
    const [editReason, setEditReason] = useState<string>(''); // Reason for edit request
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!updatedQuote || !session?.user?.id) return;

        setIsSubmitting(true);
        setErrorText('');

        try {
            if (isAdmin) {
                // NTS users can make direct edits
                onSubmit(updatedQuote);
            } else {
                // Shippers must submit edit requests for broker approval
                const originalQuote = quote;
                if (!originalQuote) {
                    setErrorText('Original quote data not available');
                    return;
                }

                // Calculate the changes between original and updated quote
                const changes: Record<string, any> = {};
                Object.keys(updatedQuote).forEach(key => {
                    const originalValue = originalQuote[key as keyof ShippingQuote];
                    const updatedValue = updatedQuote[key as keyof ShippingQuote];
                    if (originalValue !== updatedValue) {
                        changes[key] = {
                            from: originalValue,
                            to: updatedValue
                        };
                    }
                });

                // Only submit if there are actual changes
                if (Object.keys(changes).length === 0) {
                    setErrorText('No changes detected');
                    return;
                }

                // Submit edit request to database
                const { error } = await supabase
                    .from('edit_requests')
                    .insert({
                        quote_id: updatedQuote.id,
                        requested_by: session.user.id,
                        requested_changes: changes,
                        reason: editReason || null,
                        company_id: companyId,
                        status: 'pending'
                    });

                if (error) {
                    console.error('Error submitting edit request:', error);
                    setErrorText('Failed to submit edit request. Please try again.');
                    return;
                }

                // Show success message and close modal
                alert('Edit request submitted successfully! A broker will review your request and respond shortly.');
                onClose();
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            setErrorText('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Container Length</label>
                            <input
                                type="number"
                                name="container_length"
                                value={updatedQuote.container_length || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Container Type</label>
                            <input
                                type="text"
                                name="container_type"
                                value={updatedQuote.container_type || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contents Description</label>
                            <input
                                type="text"
                                name="contents_description"
                                value={updatedQuote.contents_description || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Goods Value</label>
                            <input
                                type="text"
                                name="goods_value"
                                value={updatedQuote.goods_value || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Origin Type</label>
                            <select
                                name="origin_type"
                                value={updatedQuote.origin_type === null ? '' : updatedQuote.origin_type ? 'Business' : 'Residential'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'Business' ? 'true' : 'false' } })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">Select...</option>
                                <option value="Business">Business</option>
                                <option value="Residential">Residential</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Destination Type</label>
                            <select
                                name="destination_type"
                                value={updatedQuote.destination_type === null ? '' : updatedQuote.destination_type ? 'Business' : 'Residential'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'Business' ? 'true' : 'false' } })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">Select...</option>
                                <option value="Business">Business</option>
                                <option value="Residential">Residential</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Origin Surface Type</label>
                            <input
                                type="text"
                                name="origin_surface_type"
                                value={updatedQuote.origin_surface_type || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Destination Surface Type</label>
                            <input
                                type="text"
                                name="destination_surface_type"
                                value={updatedQuote.destination_surface_type || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Is Loaded</label>
                            <select
                                name="is_loaded"
                                value={updatedQuote.is_loaded === null ? '' : updatedQuote.is_loaded ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loading By</label>
                            <select
                                name="loading_by"
                                value={updatedQuote.loading_by === null ? '' : updatedQuote.loading_by ? 'yes' : 'no'}
                                onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    </div>
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

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isAdmin ? 'Edit Quote' : 'Request Quote Edit'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {isAdmin 
                                    ? 'Make direct changes to the quote details' 
                                    : 'Submit an edit request for broker approval'
                                }
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isSubmitting}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Route Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Origin
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    type="text"
                                    placeholder='ZIP code or City, State'
                                    value={originInput}
                                    onChange={(e) => setOriginInput(e.target.value)}
                                    onBlur={handleZipCodeBlur}
                                />
                                <input type="hidden" value={originCity} />
                                <input type="hidden" value={originState} />
                                <input type="hidden" value={originZip} />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Destination
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    type="text"
                                    placeholder='ZIP code or City, State'
                                    value={destinationInput}
                                    onChange={(e) => setDestinationInput(e.target.value)}
                                    onBlur={handleZipCodeBlur}
                                />
                                <input type="hidden" value={destinationCity} />
                                <input type="hidden" value={destinationState} />
                                <input type="hidden" value={destinationZip} />
                            </div>
                        </div>

                        {/* Shipping Date */}
                        <div className="space-y-2">
                            <label className='block text-sm font-medium text-gray-700'>Requested Shipping Date</label>
                            <input
                                type='date'
                                name='due_date'
                                value={updatedQuote.due_date || ''}
                                onChange={handleChange}
                                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                            />
                        </div>

                        {/* Freight Details */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Freight Details</h3>
                            {renderInputFields()}
                        </div>
                        
                        {/* Edit reason field for shippers */}
                        {!isAdmin && (
                            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                                <label className="block text-sm font-medium text-gray-900">
                                    Reason for Edit Request (Optional)
                                </label>
                                <textarea
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    placeholder="Please explain why this edit is needed (e.g., changed pickup date, different destination, etc.)..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                                    rows={3}
                                    maxLength={500}
                                />
                                <p className="text-xs text-blue-700">
                                    💡 Providing a clear reason helps brokers process your request faster
                                </p>
                            </div>
                        )}
                        
                        {errorText && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-700 text-sm font-medium">{errorText}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isSubmitting ? 'Processing...' : isAdmin ? 'Save Changes' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditQuoteModal;