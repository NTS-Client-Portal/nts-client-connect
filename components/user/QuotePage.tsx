import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import axios from 'axios';
import { Package, Calendar, MapPin } from 'lucide-react';

interface QuotePageProps {
    onClose: () => void;
    addQuote: (quote: Partial<Database['public']['Tables']['shippingquotes']['Insert']>) => Promise<void>;
    errorText: string;
    setErrorText: (text: string) => void;
    session: Session | null;
    companyId: string;
    fetchQuotes: () => Promise<void>;
    assignedSalesUser: string;
}

const QuotePage: React.FC<QuotePageProps> = ({ onClose, addQuote, errorText, setErrorText, session, companyId, fetchQuotes, assignedSalesUser }) => {
    const supabase = useSupabaseClient<Database>();
    const [selectedOption, setSelectedOption] = useState('equipment'); // Set default value to 'equipment'
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [saveToInventory, setSaveToInventory] = useState(false);

    const handleOriginZipBlur = async () => {
        // Only proceed if originZip has a value
        if (!originZip || originZip.trim() === '') {
            console.log('handleOriginZipBlur: No input provided, skipping API call');
            return;
        }

        console.log('handleOriginZipBlur: Processing input:', originZip);
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.error('handleOriginZipBlur: Google Maps API key not found');
            return;
        }
        
        try {
            // Use Google Places API Geocoding
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    address: originZip + ', USA',
                    key: apiKey,
                    components: 'country:US'
                },
                timeout: 5000
            });

            console.log('handleOriginZipBlur: Google API response:', response.data);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const addressComponents = result.address_components;
                
                let city = '';
                let state = '';

                // Parse address components
                addressComponents.forEach(component => {
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    }
                });

                // If we got valid data, update the state
                if (city && state) {
                    setOriginCity(city);
                    setOriginState(state);
                    console.log('handleOriginZipBlur: Successfully updated location data with Google API');
                } else {
                    console.log('handleOriginZipBlur: Incomplete address data from Google API');
                }
            } else {
                console.log('handleOriginZipBlur: No results from Google API or API error:', response.data.status);
            }
        } catch (error) {
            console.error('handleOriginZipBlur: Error with Google Places API:', error);
            console.error('handleOriginZipBlur: Full error details:', error.response?.data);
            // Silently fail - the user can manually enter the information
        }
    };

    const handleDestinationZipBlur = async () => {
        // Only proceed if destinationZip has a value
        if (!destinationZip || destinationZip.trim() === '') {
            console.log('handleDestinationZipBlur: No input provided, skipping API call');
            return;
        }

        console.log('handleDestinationZipBlur: Processing input:', destinationZip);
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.error('handleDestinationZipBlur: Google Maps API key not found');
            return;
        }
        
        try {
            // Use Google Places API Geocoding
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: {
                    address: destinationZip + ', USA',
                    key: apiKey,
                    components: 'country:US'
                },
                timeout: 5000
            });

            console.log('handleDestinationZipBlur: Google API response:', response.data);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const addressComponents = result.address_components;
                
                let city = '';
                let state = '';

                // Parse address components
                addressComponents.forEach(component => {
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    }
                });

                // If we got valid data, update the state
                if (city && state) {
                    setDestinationCity(city);
                    setDestinationState(state);
                    console.log('handleDestinationZipBlur: Successfully updated location data with Google API');
                } else {
                    console.log('handleDestinationZipBlur: Incomplete address data from Google API');
                }
            } else {
                console.log('handleDestinationZipBlur: No results from Google API or API error:', response.data.status);
            }
        } catch (error) {
            console.error('handleDestinationZipBlur: Error with Google Places API:', error);
            console.error('handleDestinationZipBlur: Full error details:', error.response?.data);
            // Silently fail - the user can manually enter the information
        }
    };

    const handleSubmit = async () => {
        if (!session) {
            setErrorText('You must be logged in to submit a quote');
            return;
        }

        // Input validation
        if (!originZip || !destinationZip) {
            setErrorText('Please fill in origin and destination zip codes');
            return;
        }

        // Implement failsafe system: never block submissions
        let finalCompanyId: string | null = companyId || null;
        
        // If no company_id available, allow submission but flag for admin review
        if (!finalCompanyId) {
            console.warn('⚠️ Quote being submitted without company_id - will need admin review');
        }

        const quote = {
            user_id: session?.user.id,
            company_id: finalCompanyId, // Include company_id with failsafe
            origin_zip: originZip,
            origin_city: originCity,
            origin_state: originState,
            destination_zip: destinationZip,
            destination_city: destinationCity,
            destination_state: destinationState,
            due_date: dueDate,
            freight_type: selectedOption,
            status: 'quote', // Use lowercase for consistency
            ...formData,
            // save_to_inventory: saveToInventory,
            needs_admin_review: !finalCompanyId, // Flag for admin review if needed
        };

        try {
            const { data, error } = await supabase
                .from('shippingquotes')
                .insert([quote])
                .select();

            if (error) {
                console.error('Error submitting quote:', error.message);
                setErrorText('Error submitting quote');
            } else {
                setErrorText('');
                fetchQuotes();
                onClose();

                // If quote was saved without company_id, log critical alert
                if (data && data.length > 0 && !finalCompanyId) {
                    console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                        message: 'Quote submitted without company assignment from QuotePage',
                        quote_id: data[0].id,
                        user_id: session?.user.id,
                        timestamp: new Date().toISOString(),
                        action_required: 'Admin needs to assign company_id to this quote ASAP'
                    });
                }

                // Process any additional logic (broker assignments, inventory saving)
                if (data && data.length > 0) {
                    const quoteId = data[0].id;
                    
                    // Handle broker assignment if available
                    if (assignedSalesUser) {
                        const brokerUser = await supabase
                            .from('nts_users')
                            .select('id')
                            .eq('email', assignedSalesUser)
                            .maybeSingle();

                        if (brokerUser.data?.id) {
                            const { error: assignmentError } = await supabase
                                .from('shippingquotes')
                                .update({ assigned_sales_user: brokerUser.data.id })
                                .eq('id', quoteId);

                            if (assignmentError) {
                                console.error('Error assigning broker:', assignmentError.message);
                            }
                        } else {
                            console.error('Broker user ID is undefined');
                        }
                    }
                }

                // Handle inventory saving if requested
                if (saveToInventory) {
                    const freightData = {
                        user_id: session?.user.id,
                        year: formData.year,
                        make: formData.make,
                        model: formData.model,
                        length: formData.length,
                        width: formData.width,
                        height: formData.height,
                        weight: formData.weight,
                        freight_type: selectedOption,
                        commodity: formData.commodity,
                        pallet_count: formData.pallet_count,
                        serial_number: formData.vin,
                    };

                    const { error: inventoryError } = await supabase
                        .from('freight')
                        .insert([freightData]);

                    if (inventoryError) {
                        console.error('Error saving to inventory:', inventoryError.message);
                        setErrorText('Error saving to inventory');
                    }
                }
            }
        } catch (error) {
            console.error('Error submitting quote:', error);
            setErrorText('Error submitting quote');
        }
    };

    return (
        <div className="nts-page-layout">
            <div className="nts-page-header">
                <h1 className="text-3xl font-bold text-gray-900">New Shipping Quote</h1>
                <p className="text-gray-600 mt-2">Request a shipping estimate for your freight</p>
            </div>

            {/* <div className="mb-6">
                <Link
                    href="/user/quotes/inventory"
                    className="nts-btn-secondary inline-flex items-center gap-2"
                >
                    <Package className="w-4 h-4" />
                    Select from Inventory
                </Link>
            </div> */}

            <div className="nts-card max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <SelectOption
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        setErrorText={setErrorText}
                        session={session}
                        setFormData={setFormData}
                        formData={formData}
                        disabled={false}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Origin Information */}
                        <div className="nts-form-section">
                            <div className="nts-form-section-header">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Pickup Address</h3>
                            </div>
                            <div className="nts-form-section-body space-y-4">
                                <div className="nts-form-group">
                                    <label className="nts-label">Street Address</label>
                                    <input
                                        className="nts-input"
                                        type="text"
                                        placeholder="Enter pickup address"
                                        value={formData.origin_address || ''}
                                        onChange={e => setFormData({ ...formData, origin_address: e.target.value })}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="nts-form-group">
                                        <label className="nts-label">City</label>
                                        <input
                                            className="nts-input"
                                            type="text"
                                            placeholder="City"
                                            value={originCity}
                                            onChange={e => setOriginCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="nts-form-group">
                                        <label className="nts-label">State</label>
                                        <input
                                            className="nts-input"
                                            type="text"
                                            placeholder="State"
                                            value={originState}
                                            onChange={e => setOriginState(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="nts-form-group">
                                    <label className="nts-label">Zip Code</label>
                                    <input
                                        className="nts-input"
                                        type="text"
                                        placeholder="Zip Code"
                                        value={originZip}
                                        onChange={e => setOriginZip(e.target.value)}
                                        onBlur={handleOriginZipBlur}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Enter zip code first to auto-fill city and state
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Destination Information */}
                        <div className="nts-form-section">
                            <div className="nts-form-section-header">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                            </div>
                            <div className="nts-form-section-body space-y-4">
                                <div className="nts-form-group">
                                    <label className="nts-label">Street Address</label>
                                    <input
                                        className="nts-input"
                                        type="text"
                                        placeholder="Enter delivery address"
                                        value={formData.destination_street || ''}
                                        onChange={e => setFormData({ ...formData, destination_street: e.target.value })}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="nts-form-group">
                                        <label className="nts-label">City</label>
                                        <input
                                            className="nts-input"
                                            type="text"
                                            placeholder="City"
                                            value={destinationCity}
                                            onChange={e => setDestinationCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="nts-form-group">
                                        <label className="nts-label">State</label>
                                        <input
                                            className="nts-input"
                                            type="text"
                                            placeholder="State"
                                            value={destinationState}
                                            onChange={e => setDestinationState(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="nts-form-group">
                                    <label className="nts-label">Zip Code</label>
                                    <input
                                        className="nts-input"
                                        type="text"
                                        placeholder="Zip Code"
                                        value={destinationZip}
                                        onChange={e => setDestinationZip(e.target.value)}
                                        onBlur={handleDestinationZipBlur}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Enter zip code first to auto-fill city and state
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Date */}
                    <div className="nts-form-section">
                        <div className="nts-form-section-body">
                            <div className="max-w-xs">
                                <label className="nts-label">
                                    <Calendar className="w-4 h-4" />
                                    Shipping Date
                                </label>
                                <input
                                    className="nts-input"
                                    type="date"
                                    value={dueDate || ''}
                                    onChange={e => {
                                        setErrorText('');
                                        setDueDate(e.target.value || null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save to Inventory */}
                    {/* <div className="nts-form-section">
                        <div className="nts-form-section-body">
                            <label className="flex items-center gap-3 text-gray-900 font-medium select-none cursor-pointer">
                                <span>Save to Inventory</span>
                                <button
                                    type="button"
                                    onClick={() => setSaveToInventory(v => !v)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                                        saveToInventory ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                            saveToInventory ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-600">Save this item to your freight inventory</span>
                            </label>
                        </div>
                    </div> */}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button type="submit" className="nts-button-primary">
                            Submit Quote Request
                        </button>
                    </div>
                </form>

                {errorText && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700">{errorText}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotePage;