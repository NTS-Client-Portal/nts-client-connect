import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import axios from 'axios';

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

        const order = {
            user_id: session?.user.id,
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
            due_date: dueDate,
            earliest_pickup_date: earliestPickupDate,
            latest_pickup_date: latestPickupDate,
            freight_type: selectedOption,
            status: 'Order',
            ...formData,
            save_to_inventory: saveToInventory,
        };

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
            console.error('Error submitting order:', error);
            setErrorText('Error submitting order');
        }
    };

    return (
        <div className="container mx-auto w-full md:w-4/6 border border-x-zinc-300 border-b-zinc-300 shadow-md">
            <h2 className="text-xl font-semibold w-full h-fit bg-ntsBlue text-white border-t-4 border-t-orange-500 pt-1 px-2 pb-4">Request a Shipping Order</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 py-6 bg-white md:px-8 md:gap-12">
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
                <div className='grid grid-cols-1 md:grid-cols-2 place-items-center gap-6 md:gap-12 w-full'>
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
                        <div className='flex w-full justify-between items-center gap-8'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Street</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Street'
                                value={originStreet}
                                onChange={(e) => setOriginStreet(e.target.value)}
                            />
                        </div>
                        <h2 className='text-sm font-semibold mt-4'>Origin Point of Contact</h2>
                        <div className='flex w-full items-center gap-5'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Name</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Name'
                                value={originName}
                                onChange={(e) => setOriginName(e.target.value)}
                            />
                        </div>
                        <div className='flex w-full items-center gap-4'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Phone</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Phone'
                                value={originPhone}
                                onChange={(e) => setOriginPhone(e.target.value)}
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
                        <div className='flex w-full items-center gap-8'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Street</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Street'
                                value={destinationStreet}
                                onChange={(e) => setDestinationStreet(e.target.value)}
                            />
                        </div>
                        <h2 className='text-sm font-semibold mt-4'>Destination Point of Contact</h2>
                        <div className='flex w-full items-center gap-5'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Name</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Name'
                                value={destinationName}
                                onChange={(e) => setDestinationName(e.target.value)}
                            />
                        </div>
                        <div className='flex w-full items-center gap-4'>
                            <label className='text-zinc-900 font-medium text-nowrap'>Phone</label>
                            <input
                                className="rounded w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='Phone'
                                value={destinationPhone}
                                onChange={(e) => setDestinationPhone(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className='flex flex-col md:flex-row justify-center w-full gap-4'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Earliest Pickup Date
                        <input
                            className="rounded w-full dark:text-zinc-800 px-1 py-1.5 border border-zinc-900/30 shadow-md text-zinc-500"
                            type="date"
                            value={earliestPickupDate || ''} // Ensure earliestPickupDate is either a valid timestamp or an empty string
                            onChange={(e) => {
                                setErrorText('');
                                setEarliestPickupDate(e.target.value || null); // Set earliestPickupDate to null if the input is empty
                            }}
                        />
                    </label>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Latest Pickup Date
                        <input
                            className="rounded w-full dark:text-zinc-800 px-1 py-1.5 border border-zinc-900/30 shadow-md text-zinc-500"
                            type="date"
                            value={latestPickupDate || ''} // Ensure latestPickupDate is either a valid timestamp or an empty string
                            onChange={(e) => {
                                setErrorText('');
                                setLatestPickupDate(e.target.value || null); // Set latestPickupDate to null if the input is empty
                            }}
                        />
                    </label>
                </div>
                <div className='flex gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium' />
                    <input
                        type="checkbox"
                        checked={saveToInventory}
                        onChange={(e) => setSaveToInventory(e.target.checked)}
                    />
                    Save to Inventory
                </div>

                <div className='flex justify-center'>
                    <div className='flex gap-2 w-full justify-around'>
                        <button type="submit" className="body-btn text-sm place-self-center">
                            Request a Shipping Order
                        </button>
                    </div>
                </div>
            </form>
            {errorText && <p className="text-red-500 mt-2">{errorText}</p>}
        </div>
    );
};

export default OrderPage;