import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface QuoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    addQuote: (quote: any) => void;
    errorText: string;
    setErrorText: (value: string) => void;
    session: Session;
    fetchQuotes: () => void; // Add fetchQuotes prop
    companyId: string; // Add companyId prop
    assignedSalesUser: string; // Add assignedSalesUser prop
}

const QuoteForm: React.FC<QuoteFormProps> = ({ isOpen, onClose, addQuote, errorText, setErrorText, session, fetchQuotes, companyId, assignedSalesUser }) => {
    const supabase = useSupabaseClient<Database>();
    const [selectedOption, setSelectedOption] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [saveToInventory, setSaveToInventory] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState('');

    useEffect(() => {
        if (isOpen && session) {
            // Fetch inventory items when the form is opened
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

            fetchInventoryItems();
        }
    }, [isOpen, session, supabase]);

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
                    } else {
                        setDestinationCity(city);
                        setDestinationState(state);
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

    const handleZipCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'origin' | 'destination') => {
        if (e.key === 'Enter') {
            handleZipCodeBlur(type);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        const quote = {
            user_id: session.user.id,
            company_id: companyId, // Ensure company_id is included
            assigned_sales_user: assignedSalesUser, // Ensure assigned_sales_user is included
            origin_zip: originZip,
            origin_city: originCity,
            origin_state: originState,
            destination_zip: destinationZip,
            destination_city: destinationCity,
            destination_state: destinationState,
            due_date: dueDate,
            freight_type: selectedOption,
            status: 'Quote', // Set the status to 'Quote'
            ...formData, // Include form data from selected form
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
                fetchQuotes(); // Fetch the updated list of quotes
                onClose(); // Close the modal
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
        <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-3xl relative z-50">
                <h2 className="text-xl mb-4">Request a Shipping Estimate</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Select Inventory Item
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            value={selectedInventoryItem}
                            onChange={(e) => {
                                setSelectedInventoryItem(e.target.value);
                                if (e.target.value) {
                                    setSelectedOption('');
                                    setFormData({});
                                }
                            }}
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
                        <span className='border-b p-0 border-zinc-400 w-full'></span>
                        <span>Or</span>
                        <span className='border-b p-0 border-zinc-400 w-full'></span>
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
                        disabled={false}
                    />
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Zip
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originZip}
                                onChange={(e) => setOriginZip(e.target.value)}
                                onBlur={() => handleZipCodeBlur('origin')}
                                onKeyDown={(e) => handleZipCodeKeyDown(e, 'origin')}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin City
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originCity}
                                onChange={(e) => setOriginCity(e.target.value)}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin State
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originState}
                                onChange={(e) => setOriginState(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Zip
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationZip}
                                onChange={(e) => setDestinationZip(e.target.value)}
                                onBlur={() => handleZipCodeBlur('destination')}
                                onKeyDown={(e) => handleZipCodeKeyDown(e, 'destination')}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination City
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationCity}
                                onChange={(e) => setDestinationCity(e.target.value)}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination State
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationState}
                                onChange={(e) => setDestinationState(e.target.value)}
                            />
                        </label>
                    </div>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Shipping Date
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="date"
                            value={dueDate || ''} // Ensure dueDate is either a valid timestamp or an empty string
                            onChange={(e) => {
                                setErrorText('');
                                setDueDate(e.target.value || null); // Set dueDate to null if the input is empty
                            }}
                        />
                    </label>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>
                        <input
                            type="checkbox"
                            checked={saveToInventory}
                            onChange={(e) => setSaveToInventory(e.target.checked)}
                        />
                        Save to Inventory
                    </label>
                    <div className='flex justify-center'>
                        <div className='flex gap-2 w-full justify-around'>
                            <button type="submit" className="body-btn w-2/3 place-self-center">
                                Submit
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