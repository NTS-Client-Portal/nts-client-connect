import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import ChatInterface from './ChatInterface';
import Image from 'next/image';
import ShipperBrokerConnect from './ShipperBrokerConnect';

type ChatRequest = Database['public']['Tables']['chat_requests']['Row'];
type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];

const ShipperChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useProfilesUser();
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                        sales_user_id,
                        nts_users (
                            id,
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

    useEffect(() => {
        const fetchChatRequests = async () => {
            if (userProfile?.id) {
                const { data, error } = await supabase
                    .from('chat_requests')
                    .select('*')
                    .eq('shipper_id', userProfile.id);

                if (error) {
                    console.error('Error fetching chat requests:', error.message);
                } else {
                    setChatRequests(data);
                }
            }
        };

        fetchChatRequests();
    }, [userProfile]);

    const handleAcceptChat = async (chatId: number) => {
        setActiveChatId(chatId);

        // Update the chat request to indicate it has been accepted
        const { error } = await supabase
            .from('chat_requests')
            .update({ accepted: true })
            .eq('id', chatId);

        if (error) {
            console.error('Error accepting chat:', error.message);
        }
    };

    const handleRescheduleChat = async (chatId: number) => {
        // Implement reschedule logic here
        console.log('Reschedule chat:', chatId);
    };

    const handleDeleteChat = async (chatId: number) => {
        // Delete the chat request
        const { error } = await supabase
            .from('chat_requests')
            .delete()
            .eq('id', chatId);

        if (error) {
            console.error('Error deleting chat request:', error.message);
        } else {
            setChatRequests((prevRequests) => prevRequests.filter(request => request.id !== chatId));
        }
    };

    const NtsBrokerPicture = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/nts_users/noah-profile.png?t=2024-12-24T23%3A54%3A10.034Z`;

    return (
        <div className="md:container md:mx-auto md:p-4 flex flex-col md:flex-row items-center md:items-start gap-2">
            <div className=" md:p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
                {assignedSalesUsers.map((user, index) => (
                    <div key={index} className="broker-card flex text-nowrap flex-col justify-center items-center p-4 bg-white shadow rounded-lg w-[95vw] md:w-fit max-h-96">
                        <h2 className='text-xl underline font-bold mb-4'>Your Logistics Representative</h2>
                        <Image src={NtsBrokerPicture} alt="Profile Picture" className="avatar" width={100} height={100} />
                        <h2 className='text-xl underline font-semibold mb-4'>{user.first_name} {user.last_name}</h2>
                        <span className="flex flex-col gap-1 justify-start items-start">
                            <p><strong>Phone: </strong>{user.phone_number}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                        </span>
                        {userProfile && session && (
                            <>
                                <ShipperBrokerConnect
                                    brokerId={assignedSalesUsers[0]?.id || ''}
                                    shipperId={userProfile.id}
                                    session={session}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>
            <div className="w-fit md:w-2/3 pt-6 md:pt-6 mb-6 md:p-6 shadow-lg bg-zinc-50">
                <h1 className="text-2xl font-bold mb-4 md:mb-0 text-center md:text-start">Live Chat With {assignedSalesUsers[0]?.first_name}</h1>
                <ul>
                    {chatRequests.map((request) => (
                        <li key={request.id} className="mb-4 md:p-4 bg-white rounded-lg shadow-lg">
                            <p><strong>Topic:</strong> {request.topic}</p>
                            <p><strong>Priority:</strong> {request.priority}</p>
                            <p><strong>Broker ID:</strong> {request.broker_id}</p>
                            <div className="flex space-x-2">
                                <button className='body-btn' onClick={() => handleAcceptChat(request.id)}>Accept Chat</button>
                                <button className='body-btn' onClick={() => handleRescheduleChat(request.id)}>Reschedule</button>
                                <button className='body-btn' onClick={() => handleDeleteChat(request.id)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <ChatInterface
                    brokerId={assignedSalesUsers[0]?.id || ''}
                    shipperId={userProfile?.id || ''}
                    session={session}
                    activeChatId={activeChatId?.toString() || ''}
                />
            </div>
        </div>
    );
};

export default ShipperChatRequestsPage;