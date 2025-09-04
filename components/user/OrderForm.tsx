import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import axios from 'axios';

interface OrderFormProps {
    isOpen: boolean;
    onClose: () => void;
    addOrder: (order: any) => void;
    errorText: string;
    setErrorText: (value: string) => void;
    session: Session;
    fetchOrders: () => void;
    assignedSalesUser: string;
    companyId: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ isOpen, onClose, addOrder, errorText, setErrorText, session, companyId, fetchOrders, assignedSalesUser }) => {
    const supabase = useSupabaseClient<Database>();
    const [selectedOption, setSelectedOption] = useState('');
    const [originInput, setOriginInput] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [originAddress, setOriginAddress] = useState('');
    const [originName, setOriginName] = useState('');
    const [originPhone, setOriginPhone] = useState('');
    const [destinationInput, setDestinationInput] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationStreet, setDestinationStreet] = useState('');
    const [destinationName, setDestinationName] = useState('');
    const [destinationPhone, setDestinationPhone] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [earliestPickupDate, setEarliestPickupDate] = useState<string | null>(null);
    const [latestPickupDate, setLatestPickupDate] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [saveToInventory, setSaveToInventory] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState('');

    useEffect(() => {
        const fetchInventoryItems = async () => {
            const { data, error } = await supabase
                .from('freight')
                .select('*')
                .eq('user_id', session.user.id);

            if (error) {
                console.error('Error fetching inventory items:', error.message);
            } else {
                setInventoryItems(data);
            }
        };

        if (session) {
            fetchInventoryItems();
        }
    }, [session, supabase]);

    const handleOriginInputBlur = async () => {
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

    const handleDestinationInputBlur = async () => {
        if (destinationInput.match(/^\d{5}$/)) {
            // Input is a zip code
            try {
                const response = await axios.get(`https://api.zippopotam.us/us/${destinationInput}`);
                if (response.status === 200) {
                    const data = response.data;
                    const city = data.places[0]['place name'];
                    const state = data.places[0]['state abbreviation'];
                    setDestinationCity(city);
                    setDestinationState(state);
                    setDestinationZip(destinationInput);
                    setDestinationInput(`${city}, ${state} ${destinationInput}`);
                }
            } catch (error) {
                console.error('Error fetching city and state:', error);
            }
        } else {
            // Input is a city and state
            const [city, state] = destinationInput.split(',').map((str) => str.trim());
            if (city && state) {
                try {
                    const response = await axios.get(`https://api.zippopotam.us/us/${state}/${city}`);
                    if (response.status === 200) {
                        const data = response.data;
                        const zip = data.places[0]['post code'];
                        setDestinationCity(city);
                        setDestinationState(state);
                        setDestinationZip(zip);
                        setDestinationInput(`${city}, ${state} ${zip}`);
                    }
                } catch (error) {
                    console.error('Error fetching zip code:', error);
                }
            }
        }
    };

    const handleInventoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const itemId = e.target.value;
        setSelectedInventoryItem(itemId);
        if (itemId) {
            setSelectedOption('');
            setFormData({});

            const { data, error } = await supabase
                .from('freight')
                .select('*')
                .eq('id', Number(itemId))
                .single();

            if (error) {
                console.error('Error fetching inventory item:', error.message);
            } else if (data) {
                setSelectedOption(data.freight_type);
                setFormData(data);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const order = {
            user_id: session.user.id,
            company_id: companyId, // ADD: Include company_id in the order object
            origin_zip: originZip,
            origin_city: originCity,
            origin_state: originState,
            origin_address: originAddress,
            origin_name: originName,
            origin_phone: originPhone,
            destination_zip: destinationZip,
            destination_city: destinationCity,
            destination_state: destinationState,
            destination_street: destinationStreet,
            destination_name: destinationName,
            destination_phone: destinationPhone,
            due_date: dueDate,
            earliest_pickup_date: earliestPickupDate,
            latest_pickup_date: latestPickupDate,
            freight_type: selectedOption,
            status: 'Order',
            ...formData,
            save_to_inventory: saveToInventory,
        };

        console.log('Creating order with company_id:', companyId); // Debug log

        try {
            const { error } = await supabase
                .from('shippingquotes')
                .insert([order]);

            if (error) {
                console.error('Error submitting order:', error.message);
                setErrorText('Error submitting order');
            } else {
                setErrorText('');
                fetchOrders();
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

            if (saveToInventory) {
                const freightData = {
                    user_id: session.user.id,
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
            console.error('Error submitting order:', error);
            setErrorText('Error submitting order');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed z-50 inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center p-4">
            <div className="border-2 bg-blue-600 border-x-0 border-b-0 pt-2 rounded w-full max-w-6xl max-h-[95vh] flex flex-col">
                <h2 className="text-xl text-white font-semibold pl-4 mb-2 flex-shrink-0">Request a Shipping Order</h2>
                <div className="flex-1 overflow-y-auto bg-white">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
                    {/* Inventory Selection Section */}
                    <div className="nts-form-section">
                        <div className="nts-form-section-header">
                            <h4 className="text-lg font-medium text-gray-900">Select From Inventory</h4>
                        </div>
                        <div className="nts-form-section-body">
                            <div className="nts-form-group">
                                <label className="nts-label">Select Inventory Item</label>
                                <select
                                    className="nts-input"
                                    value={selectedInventoryItem}
                                    onChange={handleInventoryChange}
                                    disabled={!!selectedOption}
                                >
                                    <option value="">Select an item</option>
                                    {inventoryItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.year} {item.make} {item.model}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className='flex items-center justify-center gap-4'>
                        <div className='border-b border-gray-300 flex-grow'></div>
                        <span className='text-gray-500 font-medium'>Or Create New</span>
                        <div className='border-b border-gray-300 flex-grow'></div>
                    </div>

                    {/* Freight Type Selection */}
                    <SelectOption
                        selectedOption={selectedOption}
                        setSelectedOption={(option) => {
                            setSelectedOption(option);
                            if (option) {
                                setSelectedInventoryItem('');
                            }
                        }}
                        setErrorText={setErrorText}
                        session={session}
                        setFormData={setFormData}
                        formData={formData}
                        disabled={false}
                    />

                    {/* Route & Schedule Section */}
                    <div className="nts-form-section">
                        <div className="nts-form-section-header">
                            <h4 className="text-lg font-medium text-gray-900">Route & Schedule</h4>
                        </div>
                        <div className="nts-form-section-body">
                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                                {/* Origin Details */}
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Pickup Location</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="nts-form-group">
                                            <label className="nts-label">City, State or ZIP</label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder='Zip or City, State'
                                                value={originInput}
                                                onChange={(e) => setOriginInput(e.target.value)}
                                                onBlur={handleOriginInputBlur}
                                            />
                                        </div>
                                        <div className="nts-form-group">
                                            <label className="nts-label">Street Address</label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder='Street Address'
                                                value={originAddress}
                                                onChange={(e) => setOriginAddress(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="nts-form-group">
                                                <label className="nts-label">Contact Name</label>
                                                <input
                                                    className="nts-input"
                                                    type="text"
                                                    placeholder='Contact Name'
                                                    value={originName}
                                                    onChange={(e) => setOriginName(e.target.value)}
                                                />
                                            </div>
                                            <div className="nts-form-group">
                                                <label className="nts-label">Phone Number</label>
                                                <input
                                                    className="nts-input"
                                                    type="text"
                                                    placeholder='Phone Number'
                                                    value={originPhone}
                                                    onChange={(e) => setOriginPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Destination Details */}
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Delivery Location</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="nts-form-group">
                                            <label className="nts-label">City, State or ZIP</label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder='Zip or City, State'
                                                value={destinationInput}
                                                onChange={(e) => setDestinationInput(e.target.value)}
                                                onBlur={handleDestinationInputBlur}
                                            />
                                        </div>
                                        <div className="nts-form-group">
                                            <label className="nts-label">Street Address</label>
                                            <input
                                                className="nts-input"
                                                type="text"
                                                placeholder='Street Address'
                                                value={destinationStreet}
                                                onChange={(e) => setDestinationStreet(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="nts-form-group">
                                                <label className="nts-label">Contact Name</label>
                                                <input
                                                    className="nts-input"
                                                    type="text"
                                                    placeholder='Contact Name'
                                                    value={destinationName}
                                                    onChange={(e) => setDestinationName(e.target.value)}
                                                />
                                            </div>
                                            <div className="nts-form-group">
                                                <label className="nts-label">Phone Number</label>
                                                <input
                                                    className="nts-input"
                                                    type="text"
                                                    placeholder='Phone Number'
                                                    value={destinationPhone}
                                                    onChange={(e) => setDestinationPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Date Scheduling */}
                            <div className="mt-6">
                                <h5 className="font-medium text-gray-900 mb-4">Scheduling</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="nts-form-group">
                                        <label className="nts-label">Shipping Date</label>
                                        <input
                                            className="nts-input"
                                            type="date"
                                            value={dueDate || ''}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setDueDate(e.target.value || null);
                                            }}
                                        />
                                    </div>
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
                    </div>

                    {/* Options Section */}
                    <div className="nts-form-section">
                        <div className="nts-form-section-body">
                            <div className="nts-form-group">
                                <label className="nts-label flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={saveToInventory}
                                        onChange={(e) => setSaveToInventory(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    Save to Inventory
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Save this item to your inventory for future use
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex justify-center pt-4 border-t border-gray-200'>
                        <div className='flex gap-4 w-full max-w-md'>
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors">
                                Request Shipping Order
                            </button>
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Hidden inputs for parsed location data */}
                    <input type="hidden" value={originCity} />
                    <input type="hidden" value={originState} />
                    <input type="hidden" value={originZip} />
                    <input type="hidden" value={destinationCity} />
                    <input type="hidden" value={destinationState} />
                    <input type="hidden" value={destinationZip} />
                </form>
                </div>
            </div>
        </div>
    );
}

export default OrderForm;