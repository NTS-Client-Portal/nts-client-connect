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
        <div className="fixed z-40 inset-0 flex justify-center items-center p-2 md:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-gradient-to-br from-white to-zinc-50 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-7xl max-h-[98vh] overflow-y-auto border border-zinc-200">
                <div className="relative top-0 bg-gradient-to-br from-white to-zinc-50 pb-3 mb-3 border-b border-zinc-200">
                    <button
                        onClick={onClose}
                        className="float-right -mt-1 -mr-1 p-1.5 hover:bg-red-50 rounded-full transition-colors duration-200 group"
                        title="Close"
                        aria-label="Close"
                    >
                        <X size={24} className="text-zinc-600 group-hover:text-red-600 transition-colors" />
                    </button>
                    <div className="text-center pr-10">
                        <h2 className="text-2xl font-bold text-zinc-800 mb-1">Order Form</h2>
                        <p className="text-xs text-zinc-500 font-medium">Quote #{quote.id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Origin Section */}
                        <div className='flex flex-col justify-between bg-zinc-50 p-4 rounded-lg border border-zinc-300'>
                            <div className="mb-3">
                                <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                    <span className="bg-zinc-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold">A</span>
                                    Origin Location
                                </h3>
                            </div>
                            
                            <div className="space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Street Address *</label>
                                    <input
                                        type="text"
                                        placeholder='Enter the origin street address'
                                        value={originStreet}
                                        onChange={(e) => setOriginStreet(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                    <p className='font-semibold mt-1.5 text-xs text-zinc-600 bg-white px-2 py-1 rounded inline-block'>{quote.origin_city}, {quote.origin_state} {quote.origin_zip}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Contact Name *</label>
                                    <input
                                        type="text"
                                        placeholder='Enter the origin contact name'
                                        value={originName}
                                        onChange={(e) => setOriginName(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Contact Phone *</label>
                                    <input
                                        type="tel"
                                        placeholder='Enter the origin contact phone'
                                        value={originPhone}
                                        onChange={(e) => setOriginPhone(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Destination Section */}
                        <div className='flex flex-col justify-between bg-zinc-50 p-4 rounded-lg border border-zinc-300'>
                            <div className="mb-3">
                                <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                                    <span className="bg-zinc-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold">B</span>
                                    Destination Location
                                </h3>
                            </div>

                            <div className="space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Street Address *</label>
                                    <input
                                        type="text"
                                        value={destinationStreet}
                                        placeholder='Enter the destination street address'
                                        onChange={(e) => setDestinationStreet(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                    <p className='font-semibold mt-1.5 text-xs text-zinc-600 bg-white px-2 py-1 rounded inline-block'>{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Contact Name *</label>
                                    <input
                                        type="text"
                                        placeholder='Enter the destination contact name'
                                        value={destinationName}
                                        onChange={(e) => setDestinationName(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Contact Phone *</label>
                                    <input
                                        type="tel"
                                        placeholder='Enter the destination contact phone'
                                        value={destinationPhone}
                                        onChange={(e) => setDestinationPhone(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Pickup Date Range & Notes - Side by Side */}
                    <div className='w-full grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='w-full bg-zinc-50 p-4 rounded-lg border border-zinc-300'>
                            <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
                                <span className="bg-zinc-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">📅</span>
                                Pickup Window
                            </h3>
                            <div className='flex flex-col md:flex-row gap-2.5 w-full'>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Earliest Pickup Date *</label>
                                    <input
                                        type="date"
                                        value={earliestPickupDate}
                                        onChange={(e) => setEarliestPickupDate(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                        title="Select the earliest pickup date"
                                        placeholder="Earliest pickup date"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Latest Pickup Date *</label>
                                    <input
                                        type="date"
                                        value={latestPickupDate}
                                        onChange={(e) => setLatestPickupDate(e.target.value)}
                                        required
                                        className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='bg-zinc-50 p-4 rounded-lg border border-zinc-300'>
                            <label className="block text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
                                <span className="bg-zinc-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">📝</span>
                                Notes / Special Instructions
                            </label>
                            <textarea
                                value={notes}
                                placeholder="Gate pass, loading dock available, forklift needed, or any other special instructions..."
                                title="Notes or extra information"
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="rounded-md w-full p-2 text-sm border border-zinc-300 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 outline-none transition-all resize-none bg-white"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex justify-center gap-3 mt-2'>
                        <button 
                            type="submit" 
                            className="flex-1 max-w-md bg-zinc-800 hover:bg-zinc-900 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            Submit Order
                        </button>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="sm:max-w-xs bg-zinc-400 hover:bg-zinc-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderFormModal;
