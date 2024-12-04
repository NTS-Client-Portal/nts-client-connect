import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface NtsOrderListProps {
    session: any;
    fetchQuotes: () => void;
    archiveQuote: (id: number) => void;
    markAsComplete: (orderId: number) => void;
}

const NtsOrderList: React.FC<NtsOrderListProps> = ({ session, fetchQuotes, archiveQuote, markAsComplete }) => {
    const supabase = useSupabaseClient<Database>();
    const [orders, setOrders] = useState<any[]>([]);
    const [errorText, setErrorText] = useState<string>('');

    useEffect(() => {
        const fetchOrders = async () => {
            if (session?.user?.id) {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('assigned_sales_user', session.user.id);

                if (error) {
                    console.error('Error fetching orders:', error.message);
                    setErrorText('Error fetching orders');
                } else {
                    console.log('Fetched Orders:', data);
                    setOrders(data);
                }
            }
        };

        fetchOrders();
    }, [session, supabase]);

    return (
        <div className="w-full bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md border border-zinc-400 max-h-max flex-grow">
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:bg-zinc-800 dark:text-white">
                    <thead className="bg-ntsLightBlue text-zinc-50 dark:bg-zinc-900 sticky top-0">
                        <tr className='text-zinc-50 font-semibold border-b border-zinc-900 dark:border-zinc-100'>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">ID</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Origin/Destination</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Freight</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Dimensions</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Shipping Date</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider border-r border-zinc-300">Price</th>
                            <th className="pt-4 pb-1 pl-2 text-left text-xs font-semibold dark:text-white uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800/90 divide-y divide-zinc-300">
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {order.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    <div className="flex flex-col justify-start">
                                        <span><strong>Origin:</strong> {order.origin_city}, {order.origin_state} {order.origin_zip}</span>
                                        <span><strong>Destination:</strong> {order.destination_city}, {order.destination_state} {order.destination_zip}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {order.year} {order.make} {order.model}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    <div className="flex flex-col gap-1 text-sm font-medium text-zinc-900 w-full max-w-max">
                                        <span className='font-semibold flex gap-1'>
                                            Length:<p className='font-normal'>{order.length}&apos;</p>
                                            Width:<p className='font-normal'>{order.width}&apos;</p>
                                            Height:<p className='font-normal'>{order.height}&apos;</p></span>
                                        <span className='font-semibold flex gap-1'>Weight:<p className='font-normal'>{order.weight} lbs</p></span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'No due date'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap border-r border-zinc-300">
                                    {order.price ? `$${order.price}` : 'Quote Pending'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap flex items-end justify-between">
                                    <button onClick={() => archiveQuote(order.id)} className="text-red-500 ml-2">
                                        Archive
                                    </button>
                                    <button
                                        onClick={() => markAsComplete(order.id)}
                                        className="body-btn"
                                    >
                                        Mark as Complete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block 2xl:hidden">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">ID</div>
                            <div className="text-sm text-zinc-900">{order.id}</div>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Origin</div>
                            <div className="text-sm font-medium text-zinc-900">{order.origin_city}, {order.origin_state} {order.origin_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Destination</div>
                            <div className="text-sm font-medium text-zinc-900">{order.destination_city}, {order.destination_state} {order.destination_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Freight</div>
                            <div className="text-sm font-medium text-zinc-900">{order.year} {order.make} {order.model}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Dimensions</div>
                            <div className="text-sm font-medium text-zinc-900">{order.length}&apos; {order.width}&apos; {order.height}&apos; <br />{order.weight} lbs</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Shipping Date</div>
                            <div className="text-sm font-medium text-zinc-900">{order.due_date ? new Date(order.due_date).toLocaleDateString() : 'No due date'}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Price</div>
                            <div className="text-sm font-medium text-zinc-900">{order.price ? `$${order.price}` : 'Quote Pending'}</div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={() => archiveQuote(order.id)} className="text-red-500 ml-2">
                                Archive
                            </button>
                            <button
                                onClick={() => markAsComplete(order.id)}
                                className="ml-2 p-1 bg-blue-500 text-white rounded"
                            >
                                Mark as Complete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NtsOrderList;