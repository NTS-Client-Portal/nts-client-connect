import React, { useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@lib/database.types';
import { MoveHorizontal } from 'lucide-react';

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
        onSubmit({
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
        });

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
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded shadow-md w-1/2 h-[95vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold underline underline-offset-8 text-center mb-4">Quote# {quote.id} - Order Form</h2>
                {quote && (
                    <div className='flex flex-col items-center'>
                        <p><strong>Freight:</strong> {quote.year} {quote.make} {quote.model}</p>
                        <p><strong>Dimensions:</strong> {quote.length}&apos; x {quote.width}&apos; x {quote.height}&apos; {quote.weight} lbs</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className='mt-4 grid grid-cols-2 gap-4'>
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

                            <div className='flex flex-col gap-1 w-3/5'>
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
                        <div className='flex gap-1 justify-between mt-4 bg-zinc-200 p-4 rounded-md'>
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
                            <div className='flex flex-col gap-1 w-2/5'>
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
                    <div className='flex gap-1 items-end justify-center'>
                        <div>
                            <label>Earliest Pickup Date</label>
                            <input
                                type="date"
                                value={earliestPickupDate}
                                onChange={(e) => setEarliestPickupDate(e.target.value)}
                                required
                                className="rounded w-full border border-zinc-900"
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
                            placeholder='Gate pass, loading available, or any other special instructions'
                            onChange={(e) => setNotes(e.target.value)}
                            className="rounded w-full p-2 border border-zinc-900"
                        />
                    </div>


                    <div className="mt-4 border border-zinc-900 pt-4 max-h-80 p-8 overflow-y-auto">
                        <p>
                            Customer-provided load descriptions and dimensions must be accurate, loading areas and pathways must be accessible to the carrier, and any unusual conditions on-site on pickup and delivery must be advised in advance. Failure to adequately describe and report the above information or give advance notice of special conditions will incur additional charges or truck cancellation fees.
                        </p>
                        <p>
                            Transport costs are payable by bank wire, ACH, bank transfer, credit card, cash, and certified funds. All payment arrangements have been made with your account representative and paid for in full prior to pickup unless other arrangements have been made. If payment is made in full by credit card, a 3% service fee will be applied. The total cost includes all fees (taxes, insurance, and fuel surcharges that otherwise would apply).
                        </p>

                        <p>
                            Carrier insurance limits are $100,000 unless stated otherwise in writing, or additional certificates or trip riders are provided. By my signature affixed to this agreement, I hereby agree as the customer accepting the transporter&apos;s service and the broker Nationwide Transport Services (N.T.S) to pay all charges as agreed. I understand that any deposit is 100% refundable until 72 hours before my 1st available pickup date, which thereafter will be surrendered. Any cancellation must be submitted to N.T.S. via Fax or Email. I understand that the broker is not the actual transporter of my shipment and that as the broker, N.T.S. will obtain the services of a qualified carrier with the ability and qualifications to move and deliver my shipment.
                        </p>

                        <p>
                            I further understand that while every effort will be made to obtain a driver on a timely basis, the broker cannot guarantee and will not act as a guarantor of the transporter&apos;s actions. We also do not guarantee any specific delivery dates due to variables such as weather and unforeseeable events. Each transporter is an independently owned entity and is not related to the broker in any way. I agree by signature hereon that the broker cannot be held responsible for any act of negligence of the carrier or any act of God or force of nature.
                        </p>

                        <p>
                            Inspection of your shipment must be done on delivery and before signing the Bill of Lading (delivery inspection report). If there are any new damages, they must be recorded on the Bill of Lading to proceed with a claim. If you cannot inspect due to special conditions such as deliveries at night, snow, rain, dirty vehicles, etc., please mark that you cannot inspect due to these conditions on the Bill of Lading. The customer must keep a copy of the signed BOL with damages noted thereon. For vehicle shipments, the customer is responsible for removing electronic toll collectors ahead of time, like SunPass/ EZ-Pass, to avoid being charged passing tolls while in transport.
                        </p>

                        <p>
                            I understand this agreement is of no force and effect until my signature is affixed hereto unless I allow an authorized carrier to pick up my shipment, where then I will be bound by all the terms and conditions contained herein. By my signature affixed to this agreement, I hereby agree to accept the services of N.T.S and the transporter selected by N.T.S.
                        </p>


                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="agree"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="mr-2 size-4"
                                required
                            />
                            <label htmlFor="agree" className="text-base font-semibold">I agree to the terms and conditions</label>
                        </div>
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