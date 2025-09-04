import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import axios from 'axios';

interface QuoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    addQuote: (quote: any) => void;
    errorText: string;
    setErrorText: (value: string) => void;
    session: Session;
    fetchQuotes: () => void; // Add fetchQuotes prop
    assignedSalesUser: string;
    companyId: string;
    isModal?: boolean; // Add isModal prop to conditionally render modal styles
}

const QuoteForm: React.FC<QuoteFormProps> = ({ isOpen, onClose, addQuote, errorText, setErrorText, session, companyId, fetchQuotes, assignedSalesUser, isModal = true }) => {
    const supabase = useSupabaseClient<Database>();
    const [selectedOption, setSelectedOption] = useState('');
    const [originInput, setOriginInput] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [destinationInput, setDestinationInput] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);
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
                    if (!state || !city) {
                        console.error('Invalid state or city input');
                        return;
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
                    if (!state || !city) {
                        console.error('Invalid state or city input');
                        return;
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

        const quote = {
            user_id: session.user.id,
            company_id: companyId, // ADD: Include company_id in the quote object
            origin_zip: originZip,
            origin_city: originCity,
            origin_state: originState,
            destination_zip: destinationZip,
            destination_city: destinationCity,
            destination_state: destinationState,
            due_date: dueDate,
            created_at: new Date(),
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
            console.error('Error submitting quote:', error);
            setErrorText('Error submitting quote');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isModal ? "fixed z-50 inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center p-2" : "container mx-auto p-4"}>
            <div className={isModal ? "border-2 bg-blue-600 border-x-0 border-b-0 pt-2 rounded w-full max-w-6xl max-h-[95vh] flex flex-col" : ""}>
                <h2 className={isModal ? "text-lg text-white font-semibold pl-4 mb-2 flex-shrink-0" : "text-xl font-semibold mb-4"}>Request a Shipping Estimate</h2>
                <div className={isModal ? "flex-1 overflow-y-auto bg-white" : ""}>
                    <form onSubmit={handleSubmit} className={isModal ? "flex flex-col gap-3 p-4" : "flex flex-col gap-4"}>
                        {/* Inventory Selection & Route - Combined Top Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Inventory Selection */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Select From Inventory</h4>
                                <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                            {/* Route & Schedule */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Route & Schedule</h4>
                                <div className='grid grid-cols-3 gap-2'>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Origin</label>
                                        <input
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            type="text"
                                            placeholder='City, State or ZIP'
                                            value={originInput}
                                            onChange={(e) => setOriginInput(e.target.value)}
                                            onBlur={handleOriginInputBlur}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Destination</label>
                                        <input
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            type="text"
                                            placeholder='City, State or ZIP'
                                            value={destinationInput}
                                            onChange={(e) => setDestinationInput(e.target.value)}
                                            onBlur={handleDestinationInputBlur}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Ship Date</label>
                                        <input
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            type="date"
                                            value={dueDate || ''}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setDueDate(e.target.value || null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='flex items-center justify-center gap-3 my-1'>
                            <div className='border-b border-gray-300 flex-grow'></div>
                            <span className='text-gray-500 text-sm font-medium'>Freight Details</span>
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

                        {/* Options & Actions - Combined Bottom Row */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="saveToInventory"
                                    checked={saveToInventory}
                                    onChange={(e) => setSaveToInventory(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="saveToInventory" className="text-sm text-gray-700">
                                    Save to Inventory
                                </label>
                            </div>
                            
                            <div className='flex gap-3'>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-md font-medium transition-colors">
                                    Request Estimate
                                </button>
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors">
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
};

export default QuoteForm;