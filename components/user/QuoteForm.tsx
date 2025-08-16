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
        <div className={isModal ? "fixed z-50 inset-0 bg-zinc-600 bg-opacity-50 flex justify-center h-fit-content items-center" : "container mx-auto p-4"}>
            <div className={isModal ? "border-2 bg-ntsBlue border-t-orange-500 border-x-0 border-b-0 drop-shadow-xl pt-2 rounded w-sm md:w-1/2 md:max-w-none overflow-y-auto relative z-50" : ""}>
                <h2 className={isModal ? "text-xl text-white font-semibold pl-4 mb-2" : "text-xl font-semibold mb-4"}>Request a Shipping Estimate</h2>
                <form onSubmit={handleSubmit} className={isModal ? "flex flex-col gap-3 bg-white relative z-50 p-4" : "flex flex-col gap-3"}>
                    <label className='dark:text-zinc-100 font-medium'>Select Inventory Item
                        <select
                            className="rounded text-zinc-800 bg-white w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
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
                    </label>
                    <span className='flex items-center w-1/2'>
                        <span className='border-b p-0 border-zinc-400 w-1/6'></span>
                        <span className='font-semibold'>Or</span>
                        <span className='border-b p-0 border-zinc-400 w-1/6'></span>
                    </span>
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
                        formData={formData} // Pass formData to SelectOption
                        disabled={false}
                    />
                    <div className='flex flex-col md:flex-row gap-2 w-full'>
                        <div className='flex flex-col items-start'>
                            <label className='text-zinc-900 font-medium'>Origin</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Zip or City, State'
                                value={originInput}
                                onChange={(e) => setOriginInput(e.target.value)}
                                onBlur={handleOriginInputBlur}
                            />

                            <input type="hidden" value={originCity} />
                            <input type="hidden" value={originState} />
                            <input type="hidden" value={originZip} />
                        </div>
                        <div className='flex flex-col items-start'>
                            <label className='text-zinc-900 font-medium'>Destination</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Zip or City, State'
                                value={destinationInput}
                                onChange={(e) => setDestinationInput(e.target.value)}
                                onBlur={handleDestinationInputBlur}
                            />

                            <input type="hidden" value={destinationCity} />
                            <input type="hidden" value={destinationState} />
                            <input type="hidden" value={destinationZip} />
                        </div>
                        <div className='md:ml-12'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Shipping Date
                                <input
                                    className="rounded w-full dark:text-zinc-800 px-1 py-1.5 border border-zinc-900/30 shadow-md text-zinc-500"
                                    type="date"
                                    value={dueDate || ''} // Ensure dueDate is either a valid timestamp or an empty string
                                    onChange={(e) => {
                                        setErrorText('');
                                        setDueDate(e.target.value || null); // Set dueDate to null if the input is empty
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium' />
                        <input
                            type="checkbox"
                            checked={saveToInventory}
                            onChange={(e) => setSaveToInventory(e.target.checked)}
                            placeholder="Save to Inventory"
                            title="Save to Inventory"
                        />
                        Save to Inventory
                    </div>

                    <div className='flex justify-center'>
                        <div className='flex gap-2 w-full justify-around'>
                            <button type="submit" className="body-btn w-2/3 text-sm place-self-center">
                                Request a Shipping Estimate
                            </button>
                            <button onClick={onClose} className="cancel-btn mt-4 w-1/4 place-self-center">
                                Close
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuoteForm;