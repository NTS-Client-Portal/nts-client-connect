import React, { useEffect, useState } from 'react';

interface DeliveredTabProps {
    session: any;
}

const DeliveredTab: React.FC<DeliveredTabProps> = ({ session }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [errorText, setErrorText] = useState<string>('');

    useEffect(() => {
        // Fake data for demonstration purposes
        const fakeOrders = [
            {
                id: 1,
                origin_city: 'New York',
                origin_state: 'NY',
                origin_zip: '10001',
                destination_city: 'Los Angeles',
                destination_state: 'CA',
                destination_zip: '90001',
                year: '2022',
                make: 'Toyota',
                model: 'Camry',
                due_date: '2022-12-01',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                price: 1500,
            },
            {
                id: 2,
                origin_city: 'Chicago',
                origin_state: 'IL',
                origin_zip: '60601',
                destination_city: 'Houston',
                destination_state: 'TX',
                destination_zip: '77001',
                year: '2021',
                make: 'Ford',
                model: 'F-150',
                due_date: '2022-11-15',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
                price: 2000,
            },
        ];

        setOrders(fakeOrders);
    }, [session]);

    return (
        <div className="w-full bg-white  max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-ntsLightBlue font-semibold text-zinc-50 dark:bg-zinc-900/90 sticky top-0 z-10">
                        <tr className='border-b border-zinc-900/20 dark:border-zinc-100'>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">ID</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Origin/Destination</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Freight</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Shipping Date</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Contact</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Price</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900/90 divide-y divide-zinc-200">
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {order.id}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    <div className="flex flex-col justify-start">
                                        <span><strong>Origin:</strong> {order.origin_city}, {order.origin_state} {order.origin_zip}</span>
                                        <span><strong>Destination:</strong> {order.destination_city}, {order.destination_state} {order.destination_zip}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {order.year} {order.make} {order.model}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'No due date'}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {order.first_name} {order.last_name} {order.email}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {order.price ? `$${order.price}` : 'Not priced yet'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block 2xl:hidden">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">ID</div>
                            <div className="text-sm text-zinc-900">{order.id}</div>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Origin</div>
                            <div className="text-sm text-zinc-900">
                                {order.origin_city}, {order.origin_state} {order.origin_zip}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Destination</div>
                            <div className="text-sm text-zinc-900">{order.destination_city}, {order.destination_state} {order.destination_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Freight</div>
                            <div className="text-sm text-zinc-900">{order.year} {order.make} {order.model}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Shipping Date</div>
                            <div className="text-sm text-zinc-900">{order.due_date ? new Date(order.due_date).toLocaleDateString() : 'No due date'}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Contact</div>
                            <div className="text-sm text-zinc-900">{order.first_name} {order.last_name} {order.email}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Price</div>
                            <div className="text-sm text-zinc-900">{order.price ? `$${order.price}` : 'Not priced yet'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeliveredTab;