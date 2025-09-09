import React, { useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@lib/database.types';
import { MoveHorizontal, X } from 'lucide-react';

interface OrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        originStreet: string;
        originName: string;
        originPhone: string;
        destinationStreet: string;
        destinationName: string;
        destinationPhone: string;
        earliestPickupDate: string;
        latestPickupDate: string;
        notes: string;
        status: string;
        quote: Database['public']['Tables']['shippingquotes']['Row'];
    }) => void;
    quote: Database['public']['Tables']['shippingquotes']['Row'];
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, onSubmit, quote }) => {
    const [originStreet, setOriginStreet] = useState('');
    const [originName, setOriginName] = useState('');
    const [originPhone, setOriginPhone] = useState('');
    const [destinationStreet, setDestinationStreet] = useState('');
    const [destinationName, setDestinationName] = useState('');
    const [destinationPhone, setDestinationPhone] = useState('');
    const [earliestPickupDate, setEarliestPickupDate] = useState('');
    const [latestPickupDate, setLatestPickupDate] = useState('');
    const [isAgreed, setIsAgreed] = useState(false);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const orderData = {
            originStreet,
            originName,
            originPhone,
            destinationStreet,
            destinationName,
            destinationPhone,
            earliestPickupDate,
            latestPickupDate,
            notes,
            status: 'Order',
            quote
        };

        onSubmit(orderData);

        // Update the shipping quote with the new order details
        const { error } = await supabase
            .from('shippingquotes')
            .update({
                origin_street: originStreet,
                origin_name: originName,
                origin_phone: originPhone,
                destination_street: destinationStreet,
                destination_name: destinationName,
                destination_phone: destinationPhone,
                earliest_pickup_date: earliestPickupDate,
                latest_pickup_date: latestPickupDate,
                notes: notes,
                status: 'Order'
            })
            .eq('id', quote.id);

        if (error) {
            console.error('Error updating shipping quote:', error.message);
        } else {
            // Send notifications
            const notificationMessage = `A new order has been submitted for Order ID: ${quote.id}`;
            const { error: profileNotificationError } = await supabase
                .from('notifications')
                .insert({
                    user_id: quote.user_id,
                    message: notificationMessage,
                });

            if (profileNotificationError) {
                console.error('Error sending notification to profile user:', profileNotificationError.message);
            }

            const { error: ntsUserNotificationError } = await supabase
                .from('notifications')
                .insert({
                    nts_user_id: quote.user_id,
                    message: notificationMessage,
                });

            if (ntsUserNotificationError) {
                console.error('Error sending notification to NTS user:', ntsUserNotificationError.message);
            }
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center">
            <div className=" bg-white p-8 rounded shadow-md w-full max-w-4xl h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="relative w-full z-50 top-1 right-1 inline-flex justify-end"
                    title="Close"
                    aria-label="Close"
                >
                    <X size={28} />
                </button>
                <h2 className="text-2xl font-semibold underline underline-offset-8 text-center mb-4">Quote# {quote.id} - Order Form</h2>

                {quote && (
                    <div className='flex flex-col items-center'>
                        <p><strong>Freight:</strong> {quote.year} {quote.make} {quote.model}</p>
                        <p><strong>Dimensions:</strong> {quote.length}&apos; x {quote.width}&apos; x {quote.height}&apos; {quote.weight} lbs</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col justify-between bg-zinc-200 p-4 rounded-md'>
                            <label>Origin Street Address</label>
                            <input
                                type="text"
                                placeholder='Enter the origin street address'
                                value={originStreet}
                                onChange={(e) => setOriginStreet(e.target.value)}
                                required
                                className="rounded w-full p-[4px] border border-zinc-900"
                            />
                            <p className='font-semibold mt-1 text-sm'> {quote.origin_city}, {quote.origin_state} {quote.origin_zip}</p>
                            <div className='flex flex-col gap-1'>
                                <div>
                                    <label>Origin Contact Name</label>
                                    <input
                                        type="text"
                                        placeholder='Enter the origin contact name'
                                        value={originName}
                                        onChange={(e) => setOriginName(e.target.value)}
                                        required
                                        className="rounded w-full p-[4px] border border-zinc-900"
                                    />
                                </div>
                                <div>
                                    <label>Origin Contact Phone</label>
                                    <input
                                        type="tel"
                                        placeholder='Enter the origin contact phone'
                                        value={originPhone}
                                        onChange={(e) => setOriginPhone(e.target.value)}
                                        required
                                        className="rounded w-full p-[4px] border border-zinc-900"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col gap-1 justify-between mt-4 bg-zinc-200 p-4 rounded-md'>
                            <div>
                                <label>Destination Street Address</label>
                                <input
                                    type="text"
                                    value={destinationStreet}
                                    placeholder='Enter the destination street address'
                                    onChange={(e) => setDestinationStreet(e.target.value)}
                                    required
                                    className="rounded w-full p-[4px] border border-zinc-900"
                                />
                                <p className='font-semibold mt-1 text-sm'> {quote.destination_city}, {quote.destination_state} {quote.destination_zip}</p>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <div>
                                    <label>Destination Contact Name</label>
                                    <input
                                        type="text"
                                        placeholder='Enter the destination contact name'
                                        value={destinationName}
                                        onChange={(e) => setDestinationName(e.target.value)}
                                        required
                                        className="rounded w-full p-[4px] border border-zinc-900"
                                    />
                                </div>
                                <div>
                                    <label>Destination Contact Phone</label>
                                    <input
                                        type="tel"
                                        placeholder='Enter the destination contact phone'
                                        value={destinationPhone}
                                        onChange={(e) => setDestinationPhone(e.target.value)}
                                        required
                                        className="rounded w-full p-[4px] border border-zinc-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row gap-1 items-end justify-center'>
                        <div>
                            <label>Earliest Pickup Date</label>
                            <input
                                type="date"
                                value={earliestPickupDate}
                                onChange={(e) => setEarliestPickupDate(e.target.value)}
                                required
                                className="rounded w-full border border-zinc-900"
                                title="Select the earliest pickup date"
                                placeholder="Earliest pickup date"
                            />
                        </div>
                        <MoveHorizontal className='md:mb-1' />
                        <div>
                            <label>Latest Pickup Date</label>
                            <input
                                type="date"
                                value={latestPickupDate}
                                onChange={(e) => setLatestPickupDate(e.target.value)}
                                required
                                className="rounded w-full border border-zinc-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label>Notes / Extra Information</label>
                        <input
                            value={notes}
                            placeholder="Gate pass, loading available, or any other special instructions"
                            title="Notes or extra information"
                            onChange={(e) => setNotes(e.target.value)}
                            className="rounded w-full p-2 border border-zinc-900"
                        />
                    </div>
                    <div className='flex justify-evenly gap-2 mt-2'>
                        <button type="submit" className="body-btn w-2/3 place-self-center">
                            Submit
                        </button>
                        <button onClick={onClose} className="cancel-btn mt-4 place-self-center">
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderFormModal;