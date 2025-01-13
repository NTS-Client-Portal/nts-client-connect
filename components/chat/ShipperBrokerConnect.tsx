import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/initSupabase';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@lib/database.types';
import { useProfilesUser } from '@/context/ProfilesUserContext';

interface ShipperBrokerConnectProps {
    brokerId: string;
    shipperId: string;
    session: Session | null;
}

type Broker = Database['public']['Tables']['nts_users']['Row'] & {
    available: boolean;
};

type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];

const ShipperBrokerConnect: React.FC<ShipperBrokerConnectProps> = ({ brokerId, shipperId, session }) => {
    const [open, setOpen] = useState(false);
    const [broker, setBroker] = useState<Broker | null>(null);
    const [shipper, setShipper] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
    const [isBrokerAvailable, setIsBrokerAvailable] = useState(false);
    const [priority, setPriority] = useState('normal');
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const { userProfile } = useProfilesUser();
    const [topic, setTopic] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            if (!brokerId || !shipperId) {
                console.error('Invalid brokerId or shipperId');
                return;
            }

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

        if (!brokerId || !shipperId) {
            console.error('Invalid brokerId or shipperId');
            return;
        }

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

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                            sales_user_id,
                            nts_users (
                                first_name,
                                last_name,
                                email,
                                phone_number,
                                profile_picture
                            )
                        `)
                    .eq('company_id', userProfile.company_id);

                if (error) {
                    console.error('Error fetching assigned sales users:', error.message);
                } else if (data) {
                    setAssignedSalesUsers(data.map((item: any) => item.nts_users));
                }
            }
        };

        fetchAssignedSalesUsers();
    }, [userProfile]);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div className="p-4">
            <button className="body-btn" onClick={() => setOpen(true)}>Chat with {assignedSalesUsers.map((user) => user.first_name).join(', ')}</button>
            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h1 className="text-2xl font-bold text-center mb-4 text-ntsLightBlue">Schedule a Live Chat</h1>
                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500" onClick={handleClose}>Close</button>
                        {broker && shipper && (
                            <div className="mb-4">
                                <p className="text-lg"><strong>Broker:</strong> {broker.first_name} {broker.last_name}</p>
                                <p className="text-lg"><strong>Shipper:</strong> {shipper.first_name} {shipper.last_name}</p>
                            </div>
                        )}
                        {isBrokerAvailable ? (
                            <div className="animate-fade-in-out">
                                <p>The broker is available for chat.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                    <select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50">
                                        <option value="low">Broker Support</option>
                                        <option value="normal">Customer Support</option>
                                        <option value="high">Technical Support</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topic</label>
                                    <input type="text" id="topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50" />
                                </div>
                                <div className="flex justify-between">
                                    <button type="button" className="cancel-btn" onClick={handleClose}>cancel</button>
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