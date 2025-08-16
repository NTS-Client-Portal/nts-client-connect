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
        if (originZip.match(/^\d{5}$/)) {
            try {
                const response = await axios.get(`https://api.zippopotam.us/us/${originZip}`);
                if (response.status === 200) {
                    const data = response.data;
                    const city = data.places[0]['place name'];
                    const state = data.places[0]['state abbreviation'];
                    setOriginCity(city);
                    setOriginState(state);
                }
            } catch (error) {
                console.error('Error fetching city and state:', error);
            }
        }
    };

    const handleDestinationZipBlur = async () => {
        if (destinationZip.match(/^\d{5}$/)) {
            try {
                const response = await axios.get(`https://api.zippopotam.us/us/${destinationZip}`);
                if (response.status === 200) {
                    const data = response.data;
                    const city = data.places[0]['place name'];
                    const state = data.places[0]['state abbreviation'];
                    setDestinationCity(city);
                    setDestinationState(state);
                }
            } catch (error) {
                console.error('Error fetching city and state:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quote = {
            user_id: session?.user.id,
            origin_zip: originZip,
            origin_city: originCity,
            origin_state: originState,
            destination_zip: destinationZip,
            destination_city: destinationCity,
            destination_state: destinationState,
            due_date: dueDate,
            freight_type: selectedOption,
            status: 'Quote',
            ...formData,
            save_to_inventory: saveToInventory,
        };

        try {
            const { error } = await supabase
                .from('shippingquotes')
                .insert([quote]);

            if (error) {
                console.error('Error submitting quote:', error.message);
                setErrorText('Error submitting quote');
            } else {
                setErrorText('');
                fetchQuotes();
                onClose();

                // Fetch the broker's user ID
                const { data: brokerData, error: brokerError } = await supabase
                    .from('company_sales_users')
                    .select('sales_user_id')
                    .eq('company_id', companyId) // Ensure the correct company_id is used
                    .single();

                if (brokerError) {
                    console.error('Error fetching broker user ID:', brokerError.message);
                } else if (brokerData) {
                    const brokerUserId = brokerData.sales_user_id;

                    if (brokerUserId) {
                        // Send notification to the broker
                        const notificationMessage = `A new quote has been submitted by ${assignedSalesUser}`;
                        const { error: notificationError } = await supabase
                            .from('notifications')
                            .insert({
                                user_id: brokerUserId,
                                message: notificationMessage,
                            });

                        if (notificationError) {
                            console.error('Error sending notification to broker:', notificationError.message);
                        }
                    } else {
                        console.error('Broker user ID is undefined');
                    }
                }
            }

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
                                <h3 className="text-lg font-semibold text-gray-900">Origin Information</h3>
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
                                <h3 className="text-lg font-semibold text-gray-900">Destination Information</h3>
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
                    <div className="nts-form-section">
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
                    </div>

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