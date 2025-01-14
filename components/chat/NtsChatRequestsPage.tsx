import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import { Database } from '@/lib/database.types';
import { useSession } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import ForumInterface from './ForumInterface';
import RatingModal from './RatingModal';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type SupportTicket = Database['public']['Tables']['support_ticket']['Row'];

const NtsChatRequestsPage: React.FC = () => {
    const session = useSession();
    const { userProfile } = useProfilesUser();
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            setIsModalOpen(true); // Open the rating modal
        }
    };

    const handleModalSubmit = (rating: number, resolved: boolean, comments: string) => {
        // Handle the submission of the rating modal
        console.log('Rating:', rating);
        console.log('Resolved:', resolved);
        console.log('Comments:', comments);
        // You can add logic here to save the rating and comments to the database
    };

    return (
        <div className="md:p-4 bg-gray-50 flex flex-col justify-center items-center gap-2">
            <h1 className='font-semibold text-zinc-900 text-2xl'>NTS Ticket Support</h1>
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