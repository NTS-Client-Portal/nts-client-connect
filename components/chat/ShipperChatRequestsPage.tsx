import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import ForumInterface from './ForumInterface';

type SupportTicket = Database['public']['Tables']['support_ticket']['Row'];
type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];
type Notification = {
    id: number;
    message: string;
    created_at: string;
    is_read: boolean;
    type: string;
    user_id: string;
    document_id?: number;
    nts_user_id?: string;
    ticket_id?: number;
};

const ShipperChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useProfilesUser();
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [supportType, setSupportType] = useState('broker_support');
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);
    const [showTicketForm, setShowTicketForm] = useState(true);
    const [acceptedTickets, setAcceptedTickets] = useState<Set<number>>(new Set());
    const [userProfiles, setUserProfiles] = useState<{ [key: string]: AssignedSalesUser }>({});

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
        const fetchSupportTickets = async () => {
            if (userProfile?.id) {
                const { data, error } = await supabase
                    .from('support_ticket')
                    .select('*')
                    .eq('shipper_id', userProfile.id)
                    .eq('status', 'open'); // Fetch only open tickets

                if (error) {
                    console.error('Error fetching support tickets:', error.message);
                } else {
                    setSupportTickets(data);
                }
            }
        };

        fetchSupportTickets();
    }, [userProfile]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (userProfile?.id) {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('id, message, created_at, is_read, type, user_id')
                    .eq('user_id', userProfile.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching notifications:', error.message);
                } else {
                    setNotifications(data);
                }
            }
        };

        fetchNotifications();
    }, [userProfile]);

    useEffect(() => {
        const savedTicketSubmitted = localStorage.getItem('ticketSubmitted');
        const savedActiveChatId = localStorage.getItem('activeChatId');
        if (savedTicketSubmitted) {
            setTicketSubmitted(JSON.parse(savedTicketSubmitted));
        }
        if (savedActiveChatId) {
            setActiveChatId(Number(savedActiveChatId));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ticketSubmitted', JSON.stringify(ticketSubmitted));
        localStorage.setItem('activeChatId', JSON.stringify(activeChatId));
    }, [ticketSubmitted, activeChatId]);

    useEffect(() => {
        const fetchUserProfiles = async () => {
            const userIds = supportTickets.map(ticket => ticket.broker_id);
            if (userIds.length > 0) {
                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id, first_name, last_name')
                    .in('id', userIds);

                if (error) {
                    console.error('Error fetching user profiles:', error.message);
                } else {
                    const profiles = data.reduce((acc: { [key: string]: AssignedSalesUser }, profile: AssignedSalesUser) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {});
                    setUserProfiles(profiles);
                }
            }
        };

        fetchUserProfiles();
    }, [supportTickets]);

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

        // Insert support ticket
        const { data, error } = await supabase
            .from('support_ticket')
            .insert({
                message,
                broker_id: assignedUserId,
                shipper_id: userProfile?.id,
                file_url: fileUrl,
                support_type: supportType,
                request_time: new Date().toISOString(),
                topic,
                status: 'open', // Set status to open
            })
            .select();

        if (error) {
            console.error('Error creating support ticket:', error.message);
        } else {
            setMessage('');
            setFile(null);
            setTicketSubmitted(true);
            setActiveChatId(data[0].id);
            setShowTicketForm(false);
            setSupportTickets((prevTickets) => {
                const newTickets = [...prevTickets];
                const existingTicketIndex = newTickets.findIndex(ticket => ticket.id === data[0].id);
                if (existingTicketIndex === -1) {
                    newTickets.push(data[0]);
                }
                return newTickets;
            });

            // Insert initial message into messages table
            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    message_body: message,
                    ticket_id: data[0].id,
                    broker_id: assignedUserId,
                    shipper_id: userProfile?.id,
                    user_type: 'shipper',
                    file_url: fileUrl,
                    message_time: new Date().toISOString(),
                });

            if (messageError) {
                console.error('Error creating initial message:', messageError.message);
            }

            for (const email of assignedUserEmails) {
                await sendEmailNotification(email, message);
            }

            // Send notification to nts_user
            await sendNotification(assignedUserId, `A new support ticket has been submitted by ${userProfile?.first_name} ${userProfile?.last_name}.`, 'ticket_submitted');
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

    const sendNotification = async (ntsUserId: string, message: string, type: string) => {
        const { error } = await supabase
            .from('notifications')
            .insert({
                nts_user_id: ntsUserId,
                message,
                is_read: false,
                created_at: new Date().toISOString(),
                type,
            });

        if (error) {
            console.error('Error sending notification:', error.message);
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

    const handleAcceptTicket = (ticketId: number) => {
        setActiveChatId(ticketId);
        setAcceptedTickets((prev) => new Set(prev).add(ticketId));
    };

    const handleCloseTicket = async (ticketId: number) => {
        // Update the status of the ticket to closed
        const { error } = await supabase
            .from('support_ticket')
            .update({ status: 'closed' })
            .eq('id', ticketId);

        if (error) {
            console.error('Error closing support ticket:', error.message);
        } else {
            // Notify the shipper about the closed ticket
            const ticket = supportTickets.find(ticket => ticket.id === ticketId);
            if (ticket) {
                await sendNotification(ticket.shipper_id, 'Your support ticket has been closed.', 'ticket_closed');
            }

            // Remove the closed ticket from the local state
            setSupportTickets(supportTickets.filter(ticket => ticket.id !== ticketId));
            setActiveChatId(null);
        }
    };

    return (
        <div className="p-4 bg-gray-50 flex flex-col justify-center items-center gap-2">
            <h1 className='font-semibold text-zinc-900 text-2xl'>NTS Ticket Support</h1>
            {showTicketForm ? (
                <div className="p-4 rounded-lg shadow-lg w-full md:w-[90%]">
                    <form onSubmit={handleSubmit}>
                        <div className='flex flex-col md:flex-row gap-4 items-center w-full'>
                            <label className="block text-gray-700 font-semibold w-full">
                                Support Type
                                <select
                                    value={supportType}
                                    onChange={(e) => setSupportType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="broker_support">Broker Support</option>
                                    <option value="customer_support">Customer Support</option>
                                    <option value="tech_support">Technical Support</option>
                                </select>
                            </label>
                            <label className="block text-gray-700 font-semibold w-full">
                                Topic
                                <select
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="" disabled>Select Topic</option>
                                    {getTopics().map((topicOption) => (
                                        <option key={topicOption} value={topicOption}>
                                            {topicOption}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
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
                                className="w-full md:w-1/4 p-2 mt-2 bg-ntsLightBlue text-white rounded-md"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="p-4 flex justify-center rounded-lg shadow-lg w-full md:w-[90%]">
                    <button
                        onClick={() => setShowTicketForm(true)}
                        className="w-full md:w-1/3 p-2 mt-2 bg-ntsLightBlue text-white rounded-md"
                    >
                        Submit another ticket
                    </button>
                </div>
            )}
            {supportTickets.length > 0 && (
                <div className='grid grid-cols-1 md:grid-cols-[300px_1fr] w-full gap-1'>
                    <div className="w-full h-fit px-3 py-6 bg-zinc-50 rounded-lg shadow-lg mt-4">
                        <h2 className="text-lg text-nowrap font-semibold mb-4 text-center">Support Tickets</h2>
                        <ul>
                            {supportTickets.map((ticket) => (
                                <li key={ticket.id} className="mb-2">
                                    <div className="flex flex-col justify-center items-center w-full">
                                        <span className='flex flex-col justify-center items-center gap-1'><strong>Ticket #{ticket.id}</strong></span>
                                        <span className='flex justify-center items-center gap-1 flex-nowrap'><strong>Topic:</strong> {ticket.topic}</span>
                                        {userProfiles[ticket.broker_id] && (
                                            <span className='flex justify-center items-center gap-1 flex-nowrap'>
                                                <strong>Representative:</strong> {userProfiles[ticket.broker_id].first_name} {userProfiles[ticket.broker_id].last_name}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleAcceptTicket(ticket.id)}
                                            className={`px-4 py-2 my-3 text-nowrap rounded-md ${acceptedTickets.has(ticket.id) ? 'bg-gray-400/90' : 'bg-blue-500'} text-white`}
                                            disabled={acceptedTickets.has(ticket.id)}
                                        >
                                            {acceptedTickets.has(ticket.id) ? 'Ticket session opened' : 'Open'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {activeChatId && supportTickets.some(ticket => ticket.id === activeChatId) && (
                        <div className="w-full pt-6 md:pt-6 mb-6 md:p-6">
                            <ForumInterface
                                brokerId={assignedSalesUsers[0]?.id || ''} 
                                shipperId={userProfile?.id || ''}
                                session={session}
                                ticketId={activeChatId}
                            />
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => handleCloseTicket(activeChatId)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md"
                                >
                                    Close Ticket
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShipperChatRequestsPage;