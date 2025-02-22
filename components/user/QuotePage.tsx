import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
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
        <div className="container mx-auto w-full md:w-3/5 h-fit border border-x-zinc-300 border-b-zinc-300 shadow-md md:mb-20">
            <h2 className="text-xl font-semibold w-full h-fit bg-ntsBlue text-white border-t-4 border-t-orange-500 pt-1 px-2 pb-4">Request a Shipping Estimate</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-4 bg-white md:px-8 md:gap-6">
                <SelectOption
                    selectedOption={selectedOption}
                    setSelectedOption={(option) => {
                        setSelectedOption(option);
                    }}
                    setErrorText={setErrorText}
                    session={session}
                    setFormData={setFormData}
                    formData={formData} // Pass formData to SelectOption
                    disabled={false}
                />
                <div className='grid grid-cols-1 md:grid-cols-2 place-items-center gap-x-4 md:gap-x-4 w-full m-0 p-0'>
                    <div className='flex flex-col gap-1 w-full'>
                        <h2 className='text-base font-semibold'>Origin</h2>
                        <div className='flex w-full items-center gap-4'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Zip Code</label>
                            <input
                                className="rounded p-1 py-1.5 border border-zinc-900/30 shadow-md w-full"
                                type="text"
                                placeholder='Zip'
                                value={originZip}
                                onChange={(e) => setOriginZip(e.target.value)}
                                onBlur={handleOriginZipBlur}
                            />
                        </div>
                        <div className='flex justify-start gap-2 w-full items-center'>
                            <label className='text-zinc-900 font-medium text-nowrap'>City/State</label>
                            <input
                                className="rounded w-1/2 p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='City'
                                value={originCity}
                                onChange={(e) => setOriginCity(e.target.value)}
                            />
                            <input
                                className="rounded w-1/2 p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='State'
                                value={originState}
                                onChange={(e) => setOriginState(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-1 w-full'>
                        <h2 className='text-base font-semibold'>Destination</h2>
                        <div className='flex w-full items-center gap-4'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Zip Code</label>
                            <input
                                className="rounded p-1 py-1.5 border border-zinc-900/30 shadow-md w-full"
                                type="text"
                                placeholder='Zip'
                                value={destinationZip}
                                onChange={(e) => setDestinationZip(e.target.value)}
                                onBlur={handleDestinationZipBlur}
                            />
                        </div>
                        <div className='flex justify-start gap-2 w-full items-center'>
                            <label className='text-zinc-900 font-medium text-nowrap'>City/State</label>
                            <input
                                className="rounded w-1/2 p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='City'
                                value={destinationCity}
                                onChange={(e) => setDestinationCity(e.target.value)}
                            />
                            <input
                                className="rounded w-1/2 p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='State'
                                value={destinationState}
                                onChange={(e) => setDestinationState(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            <div className='flex flex-col gap-1 items-center justify-center w-full'>
                <div className='flex justify-center w-full'>
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
                <span>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium' />
                        <input
                             type="checkbox"
                             checked={saveToInventory}
                             onChange={(e) => setSaveToInventory(e.target.checked)}
                             className=''
                            />
                           <span className='text-nowrap'> Save to Inventory</span>
                       </span>
                </div>
                <div className='flex justify-center items-start w-full'>
                <button type="submit" className="body-btn text-sm place-self-start w-96">
                                Submit Quote
                            </button>

        

                    </div>
            </form>
            {errorText && <p className="text-red-500 mt-2">{errorText}</p>}
        </div>
    );
};

export default QuotePage;