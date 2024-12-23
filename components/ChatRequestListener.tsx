import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import { Database } from '@/lib/database.types';
import FloatingChatWidget from './FloatingChatWidget';
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
    const [isMinimized, setIsMinimized] = useState(false);

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

        // Update the chat request to indicate it has been accepted
        const { error } = await supabase
            .from('chat_requests')
            .update({ accepted: true })
            .eq('id', chatId);

        if (error) {
            console.error('Error accepting chat:', error.message);
        }
    };

    const handleRescheduleChat = async (chatId: string) => {
        // Implement reschedule logic here
        console.log('Reschedule chat:', chatId);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    return (
        <div>
            {chatRequests.length > 0 && (
                <div className="fixed bottom-4 right-4 bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold">New Chat Requests</h2>
                        <button onClick={toggleMinimize} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500">
                            {isMinimized ? 'Expand' : 'Minimize'}
                        </button>
                    </div>
                    {!isMinimized && (
                        <ul>
                            {chatRequests.map((request) => (
                                <li key={request.id} className="mb-2">
                                    <p><strong>Topic:</strong> {request.topic}</p>
                                    <p><strong>Priority:</strong> {request.priority}</p>
                                    <p><strong>Shipper ID:</strong> {request.shipper_id}</p>
                                    <div className="flex space-x-2">
                                        <button className='body-btn' onClick={() => handleAcceptChat(request.id)}>Accept Chat</button>
                                        <button className='body-btn' onClick={() => handleRescheduleChat(request.id)}>Reschedule</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {activeChatId && (
                <FloatingChatWidget
                    brokerId={userProfile?.id || ''}
                    shipperId={chatRequests.find((request) => request.id === activeChatId)?.shipper_id || ''}
                    session={session}
                    activeChatId={activeChatId}
                />
            )}
        </div>
    );
};

export default ChatRequestListener;