import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import ForumInterface from './ForumInterface';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type SupportTicket = Database['public']['Tables']['support_ticket']['Row'];

const NtsChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useNtsUsers();
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [supportType, setSupportType] = useState('customer_support');
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [ticketSubmitted, setTicketSubmitted] = useState(false);

    useEffect(() => {
        const fetchSupportTickets = async () => {
            if (userProfile?.id) {
                const { data, error } = await supabase
                    .from('support_ticket')
                    .select('*')
                    .eq('broker_id', userProfile.id);

                if (error) {
                    console.error('Error fetching support tickets:', error.message);
                } else {
                    setSupportTickets(data);
                }
            }
        };

        fetchSupportTickets();
    }, [userProfile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
        const { error } = await supabase
            .from('support_ticket')
            .insert({
                broker_id: userProfile?.id,
                shipper_id: null, // Assuming this is a support ticket without a specific shipper
                file_url: fileUrl,
                support_type: supportType,
                request_time: new Date().toISOString(),
                topic,
                message,
            });

        if (error) {
            console.error('Error creating support ticket:', error.message);
        } else {
            setMessage('');
            setFile(null);
            setTicketSubmitted(true);
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

    const handleAcceptTicket = async (ticketId: number) => {
        setActiveTicketId(ticketId);

        // Remove the accepted ticket from the list
        setSupportTickets(supportTickets.filter(ticket => ticket.id !== ticketId));
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
            <div className="w-full p-4 bg-white rounded-lg shadow-lg mt-4">
                <h2 className="text-2xl font-semibold mb-4">NTS Support Tickets</h2>
                <ul>
                    {supportTickets.map((ticket) => (
                        <li key={ticket.id} className="mb-2">
                            <div className="flex justify-between items-center">
                                <span>{ticket.topic}</span>
                                <button
                                    onClick={() => handleAcceptTicket(ticket.id)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                                >
                                    Accept
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {activeTicketId && (
                <div className="w-full pt-6 md:pt-6 mb-6 md:p-6 shadow-lg bg-zinc-50">
                    <ForumInterface
                        brokerId={userProfile?.id || ''}
                        shipperId={supportTickets.find((ticket) => ticket.id === activeTicketId)?.shipper_id || ''}
                        session={session}
                    />
                </div>
            )}
        </div>
    );
};

export default NtsChatRequestsPage;