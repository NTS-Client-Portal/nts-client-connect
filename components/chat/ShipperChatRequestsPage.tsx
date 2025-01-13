import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import ChatInterface from './ChatInterface';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type ChatRequest = Database['public']['Tables']['chat_requests']['Row'];
type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];

const ShipperChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useProfilesUser();
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [supportType, setSupportType] = useState('broker_support');
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let assignedUserId = '';
        let assignedUserEmails: string[] = [];

        if (supportType === 'broker_support' && assignedSalesUsers.length > 0) {
            assignedUserId = assignedSalesUsers[0].id;
            assignedUserEmails.push(assignedSalesUsers[0].email);
        } else {
            const { data: supportRolesData, error: supportRolesError } = await supabase
                .from('user_support_roles')
                .select('user_id')
                .eq('support_type', supportType);

            if (supportRolesError || !supportRolesData || supportRolesData.length === 0) {
                console.error(`Error fetching ${supportType} users:`, supportRolesError?.message);
                return;
            }

            const userIds = supportRolesData.map((item: any) => item.user_id);

            const { data: usersData, error: usersError } = await supabase
                .from('nts_users')
                .select('id, email')
                .in('id', userIds);

            if (usersError || !usersData || usersData.length === 0) {
                console.error(`Error fetching ${supportType} users:`, usersError?.message);
                return;
            }

            assignedUserId = usersData[0].id;
            assignedUserEmails = usersData.map((item: any) => item.email);
        }

        // Upload file if exists
        let fileUrl = '';
        if (file) {
            const { data, error } = await supabase.storage
                .from('feedback-support')
                .upload(`public/${file.name}`, file);

            if (error) {
                console.error('Error uploading file:', error.message);
            } else {
                fileUrl = data.path;
            }
        }

        // Insert chat request
        const { error } = await supabase
            .from('chat_requests')
            .insert({
                shipper_id: userProfile?.id,
                broker_id: assignedUserId,
                file_url: fileUrl,
                support_type: supportType,
                request_time: new Date().toISOString(),
                topic,
                session: session?.access_token || '',
            });

        if (error) {
            console.error('Error creating chat request:', error.message);
        } else {
            setMessage('');
            setFile(null);
            setTicketSubmitted(true);
            for (const email of assignedUserEmails) {
                await sendEmailNotification(email, message);
            }
        }
    };

    const sendEmailNotification = async (email: string, message: string) => {
        const response = await fetch('/.netlify/functions/sendEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: email,
                subject: 'New Support Ticket',
                text: message,
                html: `<p>${message}</p>`,
            }),
        });

        if (!response.ok) {
            console.error('Error sending email:', await response.text());
        }
    };

    const getTopics = () => {
        switch (supportType) {
            case 'broker_support':
                return ['Quote Request', 'Dispatched order', 'Issue with Carrier', 'Change in Order'];
            case 'customer_support':
                return ['Broker is not responsive', 'Damages/Claims', 'General Complaint'];
            case 'tech_support':
                return ['Bug Report', 'General Technical Assistance'];
            default:
                return [];
        }
    };

    return (
        <div className="md:container md:mx-auto md:p-4 flex flex-col justify-center items-center gap-2">
            <div className="md:p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full">
                <form onSubmit={handleSubmit}>
                    <label className="block text-gray-700 font-semibold">Support Type</label>
                    <select
                        value={supportType}
                        onChange={(e) => setSupportType(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="broker_support">Broker Support</option>
                        <option value="customer_support">Customer Support</option>
                        <option value="tech_support">Technical Support</option>
                    </select>
                    <label className="block text-gray-700 font-semibold mt-4">Topic</label>
                    <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-2 mt-2 border border-gray-300 rounded-md"
                    >
                        <option value="" disabled>Select Topic</option>
                        {getTopics().map((topicOption) => (
                            <option key={topicOption} value={topicOption}>
                                {topicOption}
                            </option>
                        ))}
                    </select>
                    <ReactQuill
                        value={message}
                        onChange={setMessage}
                        className="w-full h-24 p-2 mt-2 rounded-md"
                    />
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full p-2 mt-12 rounded-md"
                    />
                   <div className='w-full flex justify-center'>
                        <button
                            type="submit"
                            className="w-1/4 p-2 mt-2 bg-blue-500 text-white rounded-md"
                        >
                            Submit
                        </button>
                   </div>
                </form>
            </div>
            {ticketSubmitted && (
                <div className="w-full pt-6 md:pt-6 mb-6 md:p-6 shadow-lg bg-zinc-50">
                    <ChatInterface
                        brokerId={assignedSalesUsers[0]?.id || ''}
                        shipperId={userProfile?.id || ''}
                        session={session}
                        activeChatId={activeChatId?.toString() || ''}
                    />
                </div>
            )}
        </div>
    );
};

export default ShipperChatRequestsPage;