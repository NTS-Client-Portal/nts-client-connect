import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import ForumInterface from './ForumInterface';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type SupportTicket = Database['public']['Tables']['support_ticket']['Row'];

const NtsChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useProfilesUser();
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [supportType, setSupportType] = useState('customer_support');
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);
    const [showTicketForm, setShowTicketForm] = useState(true);

    useEffect(() => {
        const fetchSupportTickets = async () => {
            if (userProfile?.id) {
                const { data, error } = await supabase
                    .from('support_ticket')
                    .select('*')
                    .eq('broker_id', userProfile.id)
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
        const savedTicketSubmitted = localStorage.getItem('ticketSubmitted');
        const savedActiveChatId = localStorage.getItem('activeChatId');
        if (savedTicketSubmitted) {
            setTicketSubmitted(JSON.parse(savedTicketSubmitted));
        }
        if (savedActiveChatId) {
            setActiveTicketId(Number(savedActiveChatId));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ticketSubmitted', JSON.stringify(ticketSubmitted));
        localStorage.setItem('activeChatId', JSON.stringify(activeTicketId));
    }, [ticketSubmitted, activeTicketId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let assignedUserId = '';
        let assignedUserEmails: string[] = [];

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
                broker_id: userProfile?.id,
                shipper_id: assignedUserId,
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
            setActiveTicketId(data[0].id);
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
                    broker_id: userProfile?.id,
                    shipper_id: assignedUserId,
                    user_type: 'broker',
                    file_url: fileUrl,
                    message_time: new Date().toISOString(),
                });

            if (messageError) {
                console.error('Error creating initial message:', messageError.message);
            }

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
            case 'customer_support':
                return ['Broker is not responsive', 'Damages/Claims', 'General Complaint'];
            case 'tech_support':
                return ['Bug Report', 'General Technical Assistance'];
            default:
                return [];
        }
    };

    const handleAcceptTicket = (ticketId: number) => {
        setActiveTicketId(ticketId);
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
            // Remove the closed ticket from the local state
            setSupportTickets(supportTickets.filter(ticket => ticket.id !== ticketId));
            setActiveTicketId(null);
        }
    };

    return (
        <div className="md:p-4 bg-gray-50 flex flex-col justify-center items-center gap-2">
            <h1 className='font-semibold text-zinc-900 text-2xl'>NTS Ticket Support</h1>
            {showTicketForm ? (
                <div className="md:p-4  rounded-lg shadow-lg w-[90%]">
                    <form onSubmit={handleSubmit}>
                        <div className='flex gap-4 items-center w-full'>
                            <label className="block text-gray-700 font-semibold">Support Type
                            <select
                                value={supportType}
                                onChange={(e) => setSupportType(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="customer_support">Customer Support</option>
                                <option value="tech_support">Technical Support</option>
                            </select></label>
                            <label className="block text-gray-700 font-semibold">Topic
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
                            </select></label>
                        </div>
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
                                className="w-1/4 p-2 mt-2 bg-ntsLightBlue text-white rounded-md"
                            >
                                Submit
                            </button>
                       </div>
                    </form>
                </div>
            ) : (
                <div className="md:p-4 flex justify-center rounded-lg shadow-lg w-[90%]">
                    <button
                        onClick={() => setShowTicketForm(true)}
                        className="w-1/3 p-2 mt-2 bg-ntsLightBlue text-white rounded-md"
                    >
                        Submit another ticket
                    </button>
                </div>
            )}
            {supportTickets.length > 0 && (
                <div className='grid grid-cols-[200px_1fr] w-full gap-4'>
                    <div className="w-fit h-fit px-3 py-6 bg-zinc-50 rounded-lg shadow-lg mt-4">
                        <h2 className="text-lg text-nowrap font-semibold mb-4">Support Tickets</h2>
                        <ul>
                            {supportTickets.map((ticket) => (
                                <li key={ticket.id} className="mb-2">
                                    <div className="flex flex-col justify-between items-start">
                                        <span className='flex flex-col justify-start gap-1'><strong>Ticket Topic:</strong> {ticket.topic}</span>
                                        <button
                                            onClick={() => handleAcceptTicket(ticket.id)}
                                            className={`px-4 py-2 my-3 text-nowrap rounded-md ${activeTicketId === ticket.id ? 'bg-gray-400/90' : 'bg-blue-500'} text-white`}
                                            disabled={activeTicketId === ticket.id}
                                        >
                                            {activeTicketId === ticket.id ? 'Ticket session opened' : 'Open'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {activeTicketId && supportTickets.some(ticket => ticket.id === activeTicketId) && (
                        <div className="w-full pt-6 md:pt-6 mb-6 md:p-6">
                            <ForumInterface
                                brokerId={userProfile?.id || ''}
                                shipperId={supportTickets.find(ticket => ticket.id === activeTicketId)?.shipper_id || ''}
                                session={session}
                                ticketId={activeTicketId}
                            />
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => handleCloseTicket(activeTicketId)}
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

export default NtsChatRequestsPage;