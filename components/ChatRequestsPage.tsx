import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import ChatInterface from './ChatInterface';
import Link from 'next/link';

type ChatRequest = Database['public']['Tables']['chat_requests']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ShippingQuote = Database['public']['Tables']['shippingquotes']['Row'];

const ChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useNtsUsers();
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchColumn, setSearchColumn] = useState('company_name');

    useEffect(() => {
        const fetchAssignedCustomers = async () => {
            if (userProfile?.id) {
                // Fetch company IDs assigned to the current nts_user
                const { data: companyIdsData, error: companyIdsError } = await supabase
                    .from('company_sales_users')
                    .select('company_id')
                    .eq('sales_user_id', userProfile.id);

                if (companyIdsError) {
                    console.error('Error fetching company IDs:', companyIdsError.message);
                    return;
                }

                const companyIds = companyIdsData.map((item: any) => item.company_id);

                if (companyIds.length === 0) {
                    setCompanies([]);
                    setProfiles([]);
                    setShippingQuotes([]);
                    return;
                }

                // Fetch companies
                const { data: companiesData, error: companiesError } = await supabase
                    .from('companies')
                    .select('*')
                    .in('id', companyIds);

                if (companiesError) {
                    console.error('Error fetching assigned companies:', companiesError.message);
                } else if (companiesData) {
                    console.log('Fetched companies:', companiesData);
                    setCompanies(companiesData);
                }

                // Fetch profiles related to the companies
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('company_id', companyIds);

                if (profilesError) {
                    console.error('Error fetching profiles:', profilesError.message);
                } else if (profilesData) {
                    console.log('Fetched profiles:', profilesData);
                    setProfiles(profilesData);
                }

                // Fetch shipping quotes related to the companies
                const { data: shippingQuotesData, error: shippingQuotesError } = await supabase
                    .from('shippingquotes')
                    .select('*')
                    .in('company_id', companyIds);

                if (shippingQuotesError) {
                    console.error('Error fetching shipping quotes:', shippingQuotesError.message);
                } else if (shippingQuotesData) {
                    console.log('Fetched shipping quotes:', shippingQuotesData);
                    setShippingQuotes(shippingQuotesData);
                }
            }
        };

        fetchAssignedCustomers();
    }, [userProfile]);

    useEffect(() => {
        const fetchChatRequests = async () => {
            if (userProfile?.id) {
                const { data, error } = await supabase
                    .from('chat_requests')
                    .select('*')
                    .eq('broker_id', userProfile.id);

                if (error) {
                    console.error('Error fetching chat requests:', error.message);
                } else {
                    setChatRequests(data);
                }
            }
        };

        fetchChatRequests();
    }, [userProfile]);

    const getProfilesForCompany = (companyId: string) => {
        return profiles.filter(profile => profile.company_id === companyId);
    };

    const getShippingQuotesForCompany = (companyId: string) => {
        return shippingQuotes.filter(quote => quote.company_id === companyId);
    };

    const filteredCompanies = companies.filter(company => {
        if (searchColumn === 'company_name') {
            return company.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchColumn === 'first_name' || searchColumn === 'last_name' || searchColumn === 'email') {
            return getProfilesForCompany(company.id).some(profile =>
                profile[searchColumn]?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return false;
    });

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

    const handleRequestChat = async (profile: Profile) => {
        if (!userProfile?.id) return;

        const { error } = await supabase
            .from('chat_requests')
            .insert([{ broker_id: userProfile.id, shipper_id: profile.id, priority: 'normal', topic: 'New Chat Request', session: session?.access_token || '' }]);

        if (error) {
            console.error('Error requesting chat:', error.message);
        } else {
            console.log('Chat request sent to', profile.first_name, profile.last_name);
        }
    };

    return (
        <div className="container mx-auto p-4 flex">
            <div className='flex flex-col gap-4'>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Assigned Shippers</h2>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                    />
                    <table className="w-full bg-white border border-gray-300">
                        <thead className='bg-white text-zinc-900'>
                            <tr className='divide-x-2'>
                                <th className="text-start pl-2 pt-2 pb-1 border-b">Request a chat with your clients</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCompanies.map(company => (
                                <React.Fragment key={company.id}>
                                    <span className='border-b border-gray-300'>
                                        <tr className=" gap-2 py-2 px-1 bg-ntsBlue hover:bg-slate-400 divide-2 border border-y-zinc-300 text-white  text-start text-sm font-semibold flex flex-nowrap text-nowrap"><strong>Company: </strong>{company.company_name}
                                        </tr>
                                        {getProfilesForCompany(company.id).map(profile => (
                                            <tr key={profile.id} className="flex flex-col gap-2 py-2 px-1 hover:bg-gray-100 divide-2 border border-y-zinc-300 text-start text-sm font-semibold">
                                                <div className="flex justify-between items-center">
                                                    <span>{profile.first_name} {profile.last_name} {profile.email}</span>
                                                    <button className="body-btn" onClick={() => handleRequestChat(profile)}>Request Chat</button>
                                                </div>
                                            </tr>
                                        ))}
                                    </span>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className=" p-4">
                    <h1 className="text-2xl font-bold mb-4">Chat Requests</h1>
                    <ul>
                        {chatRequests.map((request) => (
                            <li key={request.id} className="mb-4 p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
                                <p><strong>Topic:</strong> {request.topic}</p>
                                <p><strong>Priority:</strong> {request.priority}</p>
                                <p><strong>Shipper ID:</strong> {request.shipper_id}</p>
                                <div className="flex space-x-2">
                                    <button className='body-btn' onClick={() => handleAcceptChat(request.id)}>Accept Chat</button>
                                    <button className='body-btn' onClick={() => handleRescheduleChat(request.id)}>Reschedule</button>
                                    <button className='body-btn' onClick={() => handleDeleteChat(request.id)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

               <div className='flex flex-col gap-2 w-full p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg'>
                <h2 className='text-2xl font-semibold underline'>Live Chat</h2>
                    <ChatInterface
                        brokerId={userProfile?.id || ''}
                        shipperId={chatRequests.find((request) => request.id === activeChatId)?.shipper_id || ''}
                        session={session}
                        activeChatId={activeChatId?.toString() || ''}
                    />
               </div>
        </div>
    );
};

export default ChatRequestsPage;