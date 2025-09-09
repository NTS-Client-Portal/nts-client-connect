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

    // Mapping function to normalize freight types for the switch statement
    const normalizeFreightType = (freightType: string | null): string => {
        if (!freightType) return '';
        
        const normalized = freightType.toLowerCase();
        
        // Map various input formats to consistent switch case values
        const mappings: { [key: string]: string } = {
            'equipment': 'equipment',
            'heavy machinery & equipment': 'equipment',
            'machinery': 'equipment',
            
            'freight': 'freight',
            'general freight': 'freight',
            'ltl': 'freight',
            'ftl': 'freight',
            'ltl/ftl': 'freight',
            'other': 'freight',
            
            'containers': 'containers',
            'container transport': 'containers',
            
            'semi/heavy duty trucks': 'semi_trucks',
            'commercial vehicle/trucks': 'semi_trucks',
            'semi trucks': 'semi_trucks',
            'trucks': 'semi_trucks',
            
            'auto': 'auto',
            'auto transport': 'auto',
            'vehicles': 'auto',
            
            'boats': 'boats',
            'marine': 'boats',
            
            'rv/trailers': 'trailers',
            'trailers': 'trailers',
            'rv': 'trailers'
        };
        
        return mappings[normalized] || normalized;
    };

    useEffect(() => {
        if (quote) {
            setUpdatedQuote(quote);
            setOriginZip(quote.origin_zip || '');
            setOriginCity(quote.origin_city || '');
            setOriginState(quote.origin_state || '');
            setDestinationZip(quote.destination_zip || '');
            setDestinationCity(quote.destination_city || '');
            setDestinationState(quote.destination_state || '');
            
            // Set the input display values
            if (quote.origin_city && quote.origin_state) {
                setOriginInput(`${quote.origin_city}, ${quote.origin_state}${quote.origin_zip ? ' ' + quote.origin_zip : ''}`);
            }
            if (quote.destination_city && quote.destination_state) {
                setDestinationInput(`${quote.destination_city}, ${quote.destination_state}${quote.destination_zip ? ' ' + quote.destination_zip : ''}`);
            }
        }
    }, [quote]);

    const handleOriginZipCodeBlur = async () => {
        // Only proceed if originInput has a value
        if (!originInput || originInput.trim() === '') {
            console.log('handleOriginZipCodeBlur: No input provided, skipping API call');
            return;
        }

        console.log('handleOriginZipCodeBlur: Processing input:', originInput);
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.error('handleOriginZipCodeBlur: Google Maps API key not found');
            return;
        }
        
        try {
            // Use Google Places API Geocoding
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    address: originInput + ', USA',
                    key: apiKey,
                    components: 'country:US'
                },
                timeout: 5000
            });

            console.log('handleOriginZipCodeBlur: Google API response:', response.data);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const addressComponents = result.address_components;
                
                let city = '';
                let state = '';
                let zipCode = '';

                // Parse address components
                addressComponents.forEach(component => {
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    }
                    if (component.types.includes('postal_code')) {
                        zipCode = component.long_name;
                    }
                });

                // If we got valid data, update the state
                if (city && state && zipCode) {
                    setOriginCity(city);
                    setOriginState(state);
                    setOriginZip(zipCode);
                    setOriginInput(`${city}, ${state} ${zipCode}`);
                    
                    // Update the quote with the parsed data
                    if (updatedQuote) {
                        setUpdatedQuote({
                            ...updatedQuote,
                            origin_city: city,
                            origin_state: state,
                            origin_zip: zipCode
                        });
                    }
                    console.log('handleOriginZipCodeBlur: Successfully updated location data with Google API');
                } else {
                    console.log('handleOriginZipCodeBlur: Incomplete address data from Google API');
                }
            } else {
                console.log('handleOriginZipCodeBlur: No results from Google API or API error:', response.data.status);
            }
        } catch (error) {
            console.error('handleOriginZipCodeBlur: Error with Google Places API:', error);
            console.error('handleOriginZipCodeBlur: Full error details:', error.response?.data);
            // Silently fail - the user can manually enter the information
        }
    };

    const handleDestinationZipCodeBlur = async () => {
        // Only proceed if destinationInput has a value
        if (!destinationInput || destinationInput.trim() === '') {
            console.log('handleDestinationZipCodeBlur: No input provided, skipping API call');
            return;
        }

        console.log('handleDestinationZipCodeBlur: Processing input:', destinationInput);
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.error('handleDestinationZipCodeBlur: Google Maps API key not found');
            return;
        }
        
        try {
            // Use Google Places API Geocoding
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    address: destinationInput + ', USA',
                    key: apiKey,
                    components: 'country:US'
                },
                timeout: 5000
            });

            console.log('handleDestinationZipCodeBlur: Google API response:', response.data);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const addressComponents = result.address_components;
                
                let city = '';
                let state = '';
                let zipCode = '';

                // Parse address components
                addressComponents.forEach(component => {
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    }
                    if (component.types.includes('postal_code')) {
                        zipCode = component.long_name;
                    }
                });

                // If we got valid data, update the state
                if (city && state && zipCode) {
                    setDestinationCity(city);
                    setDestinationState(state);
                    setDestinationZip(zipCode);
                    setDestinationInput(`${city}, ${state} ${zipCode}`);
                    
                    // Update the quote with the parsed data
                    if (updatedQuote) {
                        setUpdatedQuote({
                            ...updatedQuote,
                            destination_city: city,
                            destination_state: state,
                            destination_zip: zipCode
                        });
                    }
                    console.log('handleDestinationZipCodeBlur: Successfully updated location data with Google API');
                } else {
                    console.log('handleDestinationZipCodeBlur: Incomplete address data from Google API');
                }
            } else {
                console.log('handleDestinationZipCodeBlur: No results from Google API or API error:', response.data.status);
            }
        } catch (error) {
            console.error('handleDestinationZipCodeBlur: Error with Google Places API:', error);
            console.error('handleDestinationZipCodeBlur: Full error details:', error.response?.data);
            // Silently fail - the user can manually enter the information
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
                const { data: editRequestData, error } = await supabase
                    .from('edit_requests')
                    .insert({
                        quote_id: updatedQuote.id,
                        requested_by: session.user.id,
                        requested_changes: changes,
                        reason: editReason || null,
                        company_id: companyId,
                        status: 'pending'
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Error submitting edit request:', error);
                    setErrorText('Failed to submit edit request. Please try again.');
                    return;
                }

                // Create notification for the assigned broker
                try {
                    // Get the assigned sales user for this company
                    console.log('Looking for assigned sales user for company:', companyId);
                    const { data: assignmentData, error: assignmentError } = await supabase
                        .from('company_sales_users')
                        .select('sales_user_id')
                        .eq('company_id', companyId);

                    if (assignmentError) {
                        console.error('Error getting company assignment:', assignmentError);
                    } else if (assignmentData && assignmentData.length > 0) {
                        // Use the first assigned sales user if multiple exist
                        const salesUserId = assignmentData[0].sales_user_id;
                        console.log('Found assigned sales user:', salesUserId);
                        
                        // Create notification for the assigned broker
                        const changedFields = Object.keys(changes).join(', ');
                        const notificationMessage = `New edit request #${editRequestData.id} submitted for Quote #${updatedQuote.id}. Fields requested to change: ${changedFields}${editReason ? `. Reason: ${editReason}` : ''}`;
                        
                        console.log('Creating notification with message:', notificationMessage);
                        
                        const { error: notificationError } = await supabase
                            .from('notifications')
                            .insert({
                                nts_user_id: salesUserId,
                                message: notificationMessage,
                                type: 'edit_request'
                            });

                        if (notificationError) {
                            console.error('Error creating notification:', notificationError);
                        } else {
                            console.log('Notification created successfully');
                        }
                    } else {
                        console.log('No assigned sales user found for company:', companyId);
                    }
                } catch (notificationError) {
                    console.error('Error in notification creation:', notificationError);
                    // Don't fail the edit request if notification fails
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

        const normalizedType = normalizeFreightType(updatedQuote.freight_type);

        switch (normalizedType) {
            case 'equipment':
                return (
                    <div className="space-y-4">
                        {/* Equipment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.year || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.make || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.model || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="length"
                                        value={updatedQuote.length || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="length_unit"
                                        value={updatedQuote.length_unit || 'ft'}
                                        onChange={handleChange}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="ft">ft</option>
                                        <option value="in">in</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="width"
                                        value={updatedQuote.width || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="width_unit"
                                        value={updatedQuote.width_unit || 'ft'}
                                        onChange={handleChange}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="ft">ft</option>
                                        <option value="in">in</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="height"
                                        value={updatedQuote.height || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="height_unit"
                                        value={updatedQuote.height_unit || 'ft'}
                                        onChange={handleChange}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="ft">ft</option>
                                        <option value="in">in</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Weight */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="weight"
                                        value={updatedQuote.weight || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="weight_unit"
                                        value={updatedQuote.weight_unit || 'lbs'}
                                        onChange={handleChange}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="lbs">lbs</option>
                                        <option value="tons">tons</option>
                                        <option value="kg">kg</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Operational Condition</label>
                                <select
                                    name="operational_condition"
                                    value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'operable' : 'inoperable'}
                                    onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'operable' ? 'true' : 'false' } })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="operable">Operable</option>
                                    <option value="inoperable">Inoperable</option>
                                </select>
                            </div>
                        </div>

                        {/* Additional Equipment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Loading/Unloading Requirements</label>
                                <input
                                    type="text"
                                    name="loading_unloading_requirements"
                                    value={updatedQuote.loading_unloading_requirements || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., Crane required, Ramp access"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tarping Required</label>
                                <select
                                    name="tarping"
                                    value={updatedQuote.tarping === null ? '' : updatedQuote.tarping ? 'yes' : 'no'}
                                    onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'yes' ? 'true' : 'false' } })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </div>

                        {/* Auction Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Auction</label>
                                <input
                                    type="text"
                                    name="auction"
                                    value={updatedQuote.auction || ''}
                                    onChange={handleChange}
                                    placeholder="Auction name or ID"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Number</label>
                                <input
                                    type="text"
                                    name="buyer_number"
                                    value={updatedQuote.buyer_number || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lot Number</label>
                                <input
                                    type="text"
                                    name="lot_number"
                                    value={updatedQuote.lot_number || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'containers':
                return (
                    <div className="space-y-4">
                        {/* Container Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Container Length (ft)</label>
                                <input
                                    type="number"
                                    name="container_length"
                                    value={updatedQuote.container_length || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., 20, 40, 53"
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
                                    placeholder="e.g., Dry Van, Refrigerated, Flatbed"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Contents and Value */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contents Description</label>
                                <input
                                    type="text"
                                    name="contents_description"
                                    value={updatedQuote.contents_description || ''}
                                    onChange={handleChange}
                                    placeholder="Brief description of contents"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Goods Value ($)</label>
                                <input
                                    type="number"
                                    name="goods_value"
                                    value={updatedQuote.goods_value || ''}
                                    onChange={handleChange}
                                    placeholder="Total value of goods"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Origin and Destination Types */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        {/* Surface Types */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Origin Surface Type</label>
                                <input
                                    type="text"
                                    name="origin_surface_type"
                                    value={updatedQuote.origin_surface_type || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., Concrete, Gravel, Dirt"
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
                                    placeholder="e.g., Concrete, Gravel, Dirt"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Loading Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Is Container Loaded</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Loading Assistance Required</label>
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
                    </div>
                );
            case 'boats':
                return (
                    <div className="space-y-4">
                        {/* Boat Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.year || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.make || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.model || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Boat Dimensions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft)</label>
                                <input
                                    type="number"
                                    name="length"
                                    value={updatedQuote.length || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Beam/Width (ft)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={updatedQuote.width || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Height (ft)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={updatedQuote.height || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Additional Boat Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={updatedQuote.weight || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Operational Condition</label>
                                <select
                                    name="operational_condition"
                                    value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'operable' : 'inoperable'}
                                    onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'operable' ? 'true' : 'false' } })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="operable">Operable</option>
                                    <option value="inoperable">Inoperable</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'freight':
                return (
                    <div className="space-y-4">
                        {/* Load Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Commodity</label>
                                <input
                                    type="text"
                                    name="commodity"
                                    value={updatedQuote.commodity || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., Electronics, Machinery, Furniture"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Packaging Type</label>
                                <input
                                    type="text"
                                    name="packaging_type"
                                    value={updatedQuote.packaging_type || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., Palletized, Crated, Loose"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="length"
                                        value={updatedQuote.length || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="length_unit"
                                        value={updatedQuote.length_unit || 'ft'}
                                        onChange={handleChange}
                                        className="px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="in">in</option>
                                        <option value="ft">ft</option>
                                        <option value="m">m</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="width"
                                        value={updatedQuote.width || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="width_unit"
                                        value={updatedQuote.width_unit || 'ft'}
                                        onChange={handleChange}
                                        className="px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="in">in</option>
                                        <option value="ft">ft</option>
                                        <option value="m">m</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="height"
                                        value={updatedQuote.height || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="height_unit"
                                        value={updatedQuote.height_unit || 'ft'}
                                        onChange={handleChange}
                                        className="px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="in">in</option>
                                        <option value="ft">ft</option>
                                        <option value="m">m</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="weight"
                                        value={updatedQuote.weight || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <select
                                        name="weight_unit"
                                        value={updatedQuote.weight_unit || 'lbs'}
                                        onChange={handleChange}
                                        className="px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="lbs">lbs</option>
                                        <option value="tons">tons</option>
                                        <option value="kg">kg</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Freight Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Freight Class</label>
                                <input
                                    type="text"
                                    name="freight_class"
                                    value={updatedQuote.freight_class || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., 50, 60, 70, 85, etc."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lift Gate Required</label>
                                <select
                                    name="loading_assistance"
                                    value={updatedQuote.loading_assistance || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="At Origin">At Origin</option>
                                    <option value="At Destination">At Destination</option>
                                    <option value="Both Origin and Destination">Both Origin and Destination</option>
                                </select>
                            </div>
                        </div>

                        {/* Dock Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dock Access</label>
                                <select
                                    name="dock_no_dock"
                                    value={updatedQuote.dock_no_dock || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="At Origin">At Origin</option>
                                    <option value="At Destination">At Destination</option>
                                    <option value="Both">Both Locations</option>
                                    <option value="None">No Dock Access</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pieces</label>
                                <input
                                    type="number"
                                    name="pieces"
                                    value={(updatedQuote as any).pieces || ''}
                                    onChange={handleChange}
                                    placeholder="Total number of pieces/units"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'trailers':
                return (
                    <div className="space-y-4">
                        {/* Trailer Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.year || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.make || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.model || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Trailer Specifications */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft)</label>
                                <input
                                    type="text"
                                    name="length"
                                    value={updatedQuote.length || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                                <input
                                    type="text"
                                    name="weight"
                                    value={updatedQuote.weight || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'semi_trucks':
                return (
                    <div className="space-y-4">
                        {/* Semi Truck Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={updatedQuote.year || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={updatedQuote.make || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updatedQuote.model || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Engine and Specifications */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Engine/Notes</label>
                                <textarea
                                    name="notes"
                                    value={updatedQuote.notes || ''}
                                    onChange={handleChange}
                                    placeholder="Engine type, specifications, or other details"
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                                <input
                                    type="text"
                                    name="weight"
                                    value={updatedQuote.weight || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Condition and Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                                <textarea
                                    name="notes"
                                    value={updatedQuote.notes || ''}
                                    onChange={handleChange}
                                    placeholder="Vehicle condition details"
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info</label>
                                <input
                                    type="text"
                                    name="notes"
                                    value={updatedQuote.notes || ''}
                                    onChange={handleChange}
                                    placeholder="Mileage, VIN, or other details"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'auto':
                return (
                    <div className="space-y-4">
                        {/* Vehicle Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <input
                                    type="text"
                                    name="auto_year"
                                    value={updatedQuote.auto_year || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                                <input
                                    type="text"
                                    name="auto_make"
                                    value={updatedQuote.auto_make || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    type="text"
                                    name="auto_model"
                                    value={updatedQuote.auto_model || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Vehicle Identification */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">VIN</label>
                                <input
                                    type="text"
                                    name="vin"
                                    value={updatedQuote.vin || ''}
                                    onChange={handleChange}
                                    placeholder="17-character Vehicle Identification Number"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Operational Condition</label>
                                <select
                                    name="operational_condition"
                                    value={updatedQuote.operational_condition === null ? '' : updatedQuote.operational_condition ? 'operable' : 'inoperable'}
                                    onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'operable' ? 'true' : 'false' } })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="operable">Operable</option>
                                    <option value="inoperable">Inoperable</option>
                                </select>
                            </div>
                        </div>

                        {/* Vehicle Specifications */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft)</label>
                                <input
                                    type="number"
                                    name="length"
                                    value={updatedQuote.length || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Width (ft)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={updatedQuote.width || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Height (ft)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={updatedQuote.height || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Additional Vehicle Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={updatedQuote.weight || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Modifications</label>
                                <input
                                    type="text"
                                    name="modifications"
                                    value={(updatedQuote as any).modifications || ''}
                                    onChange={handleChange}
                                    placeholder="Any modifications or special equipment"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-4">
                        <div className="text-center py-8 text-gray-500">
                            <p>Please select a freight type to see specific fields for that type.</p>
                            <p className="text-sm mt-2">Or use the notes section below to provide details about your freight.</p>
                        </div>
                    </div>
                );
        }
    };

    if (!isOpen || !updatedQuote) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden  overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isAdmin ? 'Edit Quote' : 'Request Quote Edit'}
                                {updatedQuote && (
                                    <span className="ml-2 text-base font-normal text-blue-600">
                                        ({updatedQuote.freight_type
                                            ? updatedQuote.freight_type.charAt(0).toUpperCase() + updatedQuote.freight_type.slice(1)
                                            : 'Unknown Type'})
                                    </span>
                                )}
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
                                                {/* Street Address Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Origin Street Address
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    type="text"
                                    name="origin_street"
                                    placeholder='Street address (optional)'
                                    value={updatedQuote.origin_street || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Destination Street Address
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    type="text"
                                    name="destination_street"
                                    placeholder='Street address (optional)'
                                    value={updatedQuote.destination_street || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        {/* Route Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    onBlur={handleOriginZipCodeBlur}
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
                                    onBlur={handleDestinationZipCodeBlur}
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

                        {/* Notes Section - Always Visible */}
                        <div className="space-y-2">
                            <label className='block text-sm font-medium text-gray-700'>Additional Notes</label>
                            <textarea
                                name='notes'
                                value={updatedQuote.notes || ''}
                                onChange={handleChange}
                                placeholder="Add any special instructions or additional details..."
                                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none'
                                rows={3}
                            />
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