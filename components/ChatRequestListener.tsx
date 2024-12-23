import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import { Database } from '@/lib/database.types';
import ChatInterface from './ChatInterface';
import Modal from './Modal';
import { useSession } from '@supabase/auth-helpers-react';

interface ChatRequest {
    id: string;
    broker_id: string;
    shipper_id: string;
    priority: string;
    topic: string;
    created_at: string;
    accepted: boolean;
}

const ChatRequestListener: React.FC = () => {
    const session = useSession();
    const { userProfile } = useNtsUsers();
    const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    useEffect(() => {
        if (!userProfile) return;

        const channel = supabase
            .channel(`chat_requests:broker_id=eq.${userProfile.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'chat_requests' },
                (payload) => {
                    console.log('Change received!', payload);
                    setChatRequests((prevRequests) => [...prevRequests, payload.new as ChatRequest]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile]);

    const handleAcceptChat = async (chatId: string) => {
        setActiveChatId(chatId);
        setIsChatModalOpen(true);

        // Update the chat request to indicate it has been accepted
        const { error } = await supabase
            .from('chat_requests')
            .update({ accepted: true })
            .eq('id', chatId);

        if (error) {
            console.error('Error accepting chat:', error.message);
        }
    };

    return (
        <div>
            {chatRequests.length > 0 && (
                <div className="fixed bottom-4 right-4 bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-lg">
                    <h2 className="text-lg font-bold mb-2">New Chat Requests</h2>
                    <ul>
                        {chatRequests.map((request) => (
                            <li key={request.id} className="mb-2">
                                <p><strong>Topic:</strong> {request.topic}</p>
                                <p><strong>Priority:</strong> {request.priority}</p>
                                <p><strong>Shipper ID:</strong> {request.shipper_id}</p>
                                <button onClick={() => handleAcceptChat(request.id)}>Accept</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Modal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)}>
                {activeChatId && (
                    <ChatInterface
                        brokerId={userProfile?.id || ''}
                        shipperId={chatRequests.find((request) => request.id === activeChatId)?.shipper_id || ''}
                        session={session}
                    />
                )}
            </Modal>
        </div>
    );
};

export default ChatRequestListener;