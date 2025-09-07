import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import axios from 'axios';
import { Calendar, MapPin, User, Phone } from 'lucide-react';

interface OrderPageProps {
    onClose: () => void;
    addOrder: (order: Partial<Database['public']['Tables']['shippingquotes']['Insert']>) => Promise<void>;
    errorText: string;
    setErrorText: (text: string) => void;
    session: Session | null;
    companyId: string;
    fetchOrders: () => Promise<void>;
    assignedSalesUser: string;
}

const OrderPage: React.FC<OrderPageProps> = ({ onClose, addOrder, errorText, setErrorText, session, companyId, fetchOrders, assignedSalesUser }) => {
    const supabase = useSupabaseClient<Database>();
    const [selectedOption, setSelectedOption] = useState('equipment'); // Set default value to 'equipment'
    const [originStreet, setOriginStreet] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [originName, setOriginName] = useState('');
    const [originPhone, setOriginPhone] = useState('');
    const [destinationStreet, setDestinationStreet] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationName, setDestinationName] = useState('');
    const [destinationPhone, setDestinationPhone] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [earliestPickupDate, setEarliestPickupDate] = useState<string | null>(null);
    const [latestPickupDate, setLatestPickupDate] = useState<string | null>(null);
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

        if (!session) {
            setErrorText('You must be logged in to submit an order');
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
            console.warn('⚠️ Order being submitted without company_id - will need admin review');
        }

        const order = {
            user_id: session?.user.id,
            company_id: finalCompanyId, // Use failsafe company_id
            origin_street: originStreet,
            origin_zip: originZip,
            origin_city: originCity,
            origin_state: originState,
            origin_name: originName,
            origin_phone: originPhone,
            destination_street: destinationStreet,
            destination_zip: destinationZip,
            destination_city: destinationCity,
            destination_state: destinationState,
            destination_name: destinationName,
            destination_phone: destinationPhone,
            earliest_pickup_date: earliestPickupDate,
            latest_pickup_date: latestPickupDate,
            freight_type: selectedOption,
            status: 'order', // Already lowercase
            ...formData,
            save_to_inventory: saveToInventory,
            needs_admin_review: !finalCompanyId, // Flag for admin review if needed
        };

        try {
            const { data, error } = await supabase
                .from('shippingquotes')
                .insert([order])
                .select();

            if (error) {
                console.error('Error submitting order:', error.message);
                setErrorText('Error submitting order');
            } else {
                setErrorText('');
                fetchOrders();
                onClose();

                // If order was saved without company_id, log critical alert
                if (data && data.length > 0 && !finalCompanyId) {
                    console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                        message: 'Order submitted without company assignment from OrderPage',
                        order_id: data[0].id,
                        user_id: session?.user.id,
                        timestamp: new Date().toISOString(),
                        action_required: 'Admin needs to assign company_id to this order ASAP'
                    });
                }

                // Fetch the broker's user ID (only if we have a company_id)
                if (finalCompanyId) {
                    const { data: brokerData, error: brokerError } = await supabase
                        .from('company_sales_users')
                        .select('sales_user_id')
                        .eq('company_id', finalCompanyId)
                        .maybeSingle(); // Use maybeSingle instead of single

                    if (brokerError) {
                        console.error('Error fetching broker user ID:', brokerError.message);
                    } else if (brokerData) {
                        const brokerUserId = brokerData.sales_user_id;

                        if (brokerUserId) {
                            // Send notification to the broker
                            const notificationMessage = `A new order has been submitted by ${assignedSalesUser}`;
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
            console.error('Error submitting order:', error);
            setErrorText('Error submitting order');
        }
    };

    return (
        <div className="nts-page-layout">
            <div className="nts-page-header">
                <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
                <p className="text-gray-600 mt-2">Create a direct shipping order with detailed pickup and delivery information</p>
            </div>

            <div className="nts-card max-w-6xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <SelectOption
                        selectedOption={selectedOption}
                        setSelectedOption={(option) => {
                            setSelectedOption(option);
                        }}
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
                                <h3 className="text-lg font-semibold text-gray-900">Pickup Location</h3>
                            </div>
                            <div className="nts-form-section-body space-y-4">
                                <div className="nts-form-group">
                                    <label className="nts-label">Street Address</label>
                                    <input
                                        className="nts-input"
                                        type="text"
                                        placeholder="Enter pickup address"
                                        value={originStreet}
                                        onChange={(e) => setOriginStreet(e.target.value)}
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
                                            onChange={(e) => setOriginCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="nts-form-group">
                                        <label className="nts-label">State</label>
                                        <input
                                            className="nts-input"
                                            type="text"
                                            placeholder="State"
                                            value={originState}
                                            onChange={(e) => setOriginState(e.target.value)}
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
                                        onChange={(e) => setOriginZip(e.target.value)}
                                        onBlur={handleOriginZipBlur}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Enter zip code first to auto-fill city and state
                                    </p>
                                </div>

                                {/* Origin Contact */}
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Pickup Contact
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="nts-form-group">
                                            <label className="nts-label">Contact Name</label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder="Contact person name"
                                                value={originName}
                                                onChange={(e) => setOriginName(e.target.value)}
                                            />
                                        </div>
                                        <div className="nts-form-group">
                                            <label className="nts-label">
                                                <Phone className="w-4 h-4" />
                                                Phone Number
                                            </label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder="Contact phone number"
                                                value={originPhone}
                                                onChange={(e) => setOriginPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Destination Information */}
                        <div className="nts-form-section">
                            <div className="nts-form-section-header">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Delivery Location</h3>
                            </div>
                            <div className="nts-form-section-body space-y-4">
                                <div className="nts-form-group">
                                    <label className="nts-label">Street Address</label>
                                    <input
                                        className="nts-input"
                                        type="text"
                                        placeholder="Enter delivery address"
                                        value={destinationStreet}
                                        onChange={(e) => setDestinationStreet(e.target.value)}
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
                                            onChange={(e) => setDestinationCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="nts-form-group">
                                        <label className="nts-label">State</label>
                                        <input
                                            className="nts-input"
                                            type="text"
                                            placeholder="State"
                                            value={destinationState}
                                            onChange={(e) => setDestinationState(e.target.value)}
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
                                        onChange={(e) => setDestinationZip(e.target.value)}
                                        onBlur={handleDestinationZipBlur}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Enter zip code first to auto-fill city and state
                                    </p>
                                </div>

                                {/* Destination Contact */}
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Delivery Contact
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="nts-form-group">
                                            <label className="nts-label">Contact Name</label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder="Contact person name"
                                                value={destinationName}
                                                onChange={(e) => setDestinationName(e.target.value)}
                                            />
                                        </div>
                                        <div className="nts-form-group">
                                            <label className="nts-label">
                                                <Phone className="w-4 h-4" />
                                                Phone Number
                                            </label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder="Contact phone number"
                                                value={destinationPhone}
                                                onChange={(e) => setDestinationPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pickup Date Range */}
                    <div className="nts-form-section">
                        <div className="nts-form-section-header">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Pickup Schedule</h3>
                        </div>
                        <div className="nts-form-section-body">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="nts-form-group">
                                    <label className="nts-label">Earliest Pickup Date</label>
                                    <input
                                        className="nts-input"
                                        type="date"
                                        value={earliestPickupDate || ''}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setEarliestPickupDate(e.target.value || null);
                                        }}
                                    />
                                </div>
                                <div className="nts-form-group">
                                    <label className="nts-label">Latest Pickup Date</label>
                                    <input
                                        className="nts-input"
                                        type="date"
                                        value={latestPickupDate || ''}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setLatestPickupDate(e.target.value || null);
                                        }}
                                    />
                                </div>
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
                            Create Shipping Order
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

export default OrderPage;