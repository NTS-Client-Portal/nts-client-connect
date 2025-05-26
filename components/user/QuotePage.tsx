import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import axios from 'axios';

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
        <div className="container ml-64 w-full">
        <h2 className="text-2xl font-bold w-full bg-white text-ntsBlue pt-3 pb-4 ">
            Shipping Estimate Request
        </h2>

        <Link
            href="/user/quotes/inventory"
            className="bg-indigo-600 px-4 py-2 text-white rounded-md hover:bg-indigo-950"
        >
            Select from Inventory
        </Link>
        <form onSubmit={handleSubmit} className="ml-12 mt-12 w-full md:w-3/5 max-w-7xl flex flex-col gap-6 px-4 py-6 md:px-8 rounded-xl shadow-md border border-zinc-100 bg-white md:mb-20">
            <SelectOption
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                setErrorText={setErrorText}
                session={session}
                setFormData={setFormData}
                formData={formData}
                disabled={false}
            />

            <label className="label-font w-full">
                    Shipping Date
                    <input
                        className="form-input mt-2"
                        type="date"
                        value={dueDate || ''}
                        onChange={e => {
                            setErrorText('');
                            setDueDate(e.target.value || null);
                        }}
                    />
                </label>
            <div className="grid grid-cols-1 gap-6">
                {/* Origin */}
                <div className="flex flex-col gap-2 w-full">
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Origin Information</h3>
                    <div className='border border-zinc-100 p-4 rounded-md bg-white'>

                        <div className="block">
                            <label className="label-font w-full">Address 
                                <input
                                    className="form-input mt-3 w-full"
                                    type="text"
                                    placeholder="Street Address"
                                    value={formData.origin_address || ''}
                                    onChange={e => setFormData({ ...formData, origin_address: e.target.value })}
                                />
                            </label>
                            <div className='flex flex-nowrap gap-3 w-full mt-4'>
                                <label className="label-font w-1/3">City
                                    <input
                                        className="form-input mt-2"
                                        type="text"
                                        placeholder="City"
                                        value={originCity}
                                        onChange={e => setOriginCity(e.target.value)}
                                    />
                                </label>
                                <label className="label-font w-1/3">State
                                    <input
                                        className="form-input mt-2"
                                        type="text"
                                        placeholder="State"
                                        value={originState}
                                        onChange={e => setOriginState(e.target.value)}
                                    />
                                </label>
                                <label className="label-font w-1/3">Zip Code
                                <input
                                    className="form-input mt-2"
                                    type="text"
                                    placeholder="Zip"
                                    value={originZip}
                                    onChange={e => setOriginZip(e.target.value)}
                                    onBlur={handleOriginZipBlur}
                                />
                            </label>
                            </div>
                    </div>
                    </div>
                </div>
                {/* Destination */}
                <div className="flex flex-col gap-2 w-full">
                    <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Destination Information</h3>
                    <div className='border border-zinc-100 p-4 rounded-md bg-white'>

                        <div className="block">
                            <label className="label-font w-full">Address 
                                <input
                                    className="form-input mt-2"
                                    type="text"
                                    placeholder="Street Address"
                                    value={formData.destination_street || ''}
                                    onChange={e => setFormData({ ...formData, destination_street: e.target.value })}
                                />
                            </label>
                           <div className='flex flex-nowrap gap-3 w-full mt-3'>
                                <label className="label-font w-1/3">City
                                    <input
                                        className="form-input mt-2"
                                        type="text"
                                        placeholder="City"
                                        value={destinationCity}
                                        onChange={e => setDestinationCity(e.target.value)}
                                    />
                                </label>
                                <label className="label-font w-1/3">State
                                    <input
                                        className="form-input mt-2"
                                        type="text"
                                        placeholder="State"
                                        value={destinationState}
                                        onChange={e => setDestinationState(e.target.value)}
                                    />
                                </label>
                                <label className="label-font w-1/3">Zip Code
                                <input
                                    className="form-input mt-2"
                                    type="text"
                                    placeholder="Zip"
                                    value={destinationZip}
                                    onChange={e => setDestinationZip(e.target.value)}
                                    onBlur={handleDestinationZipBlur}
                                />
                            </label>
                           </div>
                    </div>
                    </div>
                </div>
            </div>
            {/* Shipping Date & Save to Inventory */}
                    <div className="flex flex-col md:flex-row gap-4 items-start">
            <label className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100 font-medium w-full md:w-1/2 select-none">
                <span>Save to Inventory</span>
                <button
                    type="button"
                    aria-pressed={saveToInventory}
                    onClick={() => setSaveToInventory(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        saveToInventory ? 'bg-ntsBlue' : 'bg-zinc-300'
                    }`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            saveToInventory ? 'translate-x-5' : 'translate-x-1'
                        }`}
                    />
                </button>
            </label>
        </div>
            <div className="flex justify-end">
                <button type="submit" className="body-btn text-base w-32 px-4 py-2 text-white rounded-md hover:bg-ntsBlue/90 transition-colors">
                    Submit 
                </button>
            </div>
        </form>
        {errorText && <p className="text-red-500 mt-2 px-4">{errorText}</p>}
    </div>
);
};

export default QuotePage;