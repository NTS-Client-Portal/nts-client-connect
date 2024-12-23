import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/initSupabase';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@lib/database.types';

interface ShipperBrokerConnectProps {
    brokerId: string;
    shipperId: string;
    session: Session | null;
}

type Broker = Database['public']['Tables']['nts_users']['Row'] & {
    available: boolean;
};

const ShipperBrokerConnect: React.FC<ShipperBrokerConnectProps> = ({ brokerId, shipperId, session }) => {
    const [open, setOpen] = useState(false);
    const [broker, setBroker] = useState<Broker | null>(null);
    const [shipper, setShipper] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
    const [isBrokerAvailable, setIsBrokerAvailable] = useState(false);
    const [priority, setPriority] = useState('normal');
    const [topic, setTopic] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            const { data: brokerData, error: brokerError } = await supabase
                .from('nts_users')
                .select('*')
                .eq('id', brokerId)
                .single();

            const { data: shipperData, error: shipperError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', shipperId)
                .single();

            if (brokerError) {
                console.error('Error fetching broker:', brokerError.message);
            } else {
                setBroker(brokerData as Broker);
                setIsBrokerAvailable((brokerData as Broker)?.available ?? false);
            }

            if (shipperError) {
                console.error('Error fetching shipper:', shipperError.message);
            } else {
                setShipper(shipperData);
            }
        };

        fetchUsers();
    }, [brokerId, shipperId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('chat_requests')
            .insert([{ broker_id: brokerId, shipper_id: shipperId, priority, topic, session: session?.access_token ?? '' }]);

        if (error) {
            console.error('Error submitting request:', error);
        } else {
            setPriority('normal');
            setTopic('');
            setOpen(false);
        }
    };

    return (
        <div className="p-4">
            <button className="body-btn" onClick={() => setOpen(true)}>Live Chat</button>
            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h1 className="text-2xl font-bold text-center mb-4 text-ntsLightBlue">Live Chat</h1>
                        <button className="absolute top-4 cancel-btn right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500" onClick={() => setOpen(false)}>Close</button>
                        {broker && shipper && (
                            <div className="mb-4">
                                <p className="text-lg"><strong>Broker:</strong> {broker.first_name} {broker.last_name}</p>
                                <p className="text-lg"><strong>Shipper:</strong> {shipper.first_name} {shipper.last_name}</p>
                            </div>
                        )}
                        {isBrokerAvailable ? (
                            <div className="animate-fade-in-out">
                                {/* Live chat UI */}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                    <select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50">
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                                    <input type="text" id="topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50" />
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="body-btn">Request Chat</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShipperBrokerConnect;