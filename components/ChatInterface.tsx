import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@/lib/database.types';

interface ChatInterfaceProps {
    brokerId: string;
    shipperId: string;
    session: Session | null;
    activeChatId: string;
}

interface Message {
    id: number;
    broker_id: string | null;
    shipper_id: string | null;
    message_body: string;
    message_time: string | null;
    user_type: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ brokerId, shipperId, session, activeChatId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatEnded, setIsChatEnded] = useState(false);

    useEffect(() => {
        if (!brokerId || !shipperId) {
            console.error('Invalid brokerId or shipperId');
            return;
        }

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`broker_id.eq.${brokerId},shipper_id.eq.${shipperId}`)
                .order('message_time', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error.message);
            } else {
                setMessages(data);
            }
        };

        fetchMessages();

        const subscription = supabase
            .channel(`public:messages:broker_id=eq.${brokerId},shipper_id=eq.${shipperId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [brokerId, shipperId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Ensure brokerId and shipperId are valid UUIDs
        if (!brokerId || !shipperId) {
            console.error('Invalid brokerId or shipperId');
            return;
        }

        // Check if brokerId and shipperId exist in the respective tables
        const { data: brokerData, error: brokerError } = await supabase
            .from('nts_users')
            .select('id')
            .eq('id', brokerId)
            .single();

        const { data: shipperData, error: shipperError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', shipperId)
            .single();

        if (brokerError || !brokerData) {
            console.error('Broker ID does not exist:', brokerError?.message);
            return;
        }

        if (shipperError || !shipperData) {
            console.error('Shipper ID does not exist:', shipperError?.message);
            return;
        }

        // Determine the user type based on the session user ID
        const userType = session?.user.id === brokerId ? 'broker' : 'shipper';

        const { error } = await supabase
            .from('messages')
            .insert([{ broker_id: brokerId, shipper_id: shipperId, message_body: newMessage, user_type: userType }]);

        if (error) {
            console.error('Error sending message:', error.message);
        } else {
            setNewMessage(''); // Clear the input box
        }
    };

    const handleEndChat = async () => {
        setIsChatEnded(true);
        const endMessage = {
            broker_id: brokerId,
            shipper_id: shipperId,
            id: Date.now(), // or any unique identifier
            message_body: 'Chat session has ended.',
            user_type: 'system',
            message_time: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('messages')
            .insert([endMessage]);

        if (error) {
            console.error('Error ending chat:', error.message);
        } else {
            setMessages((prevMessages) => [...prevMessages, endMessage]);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-lg w-full h-[500px]">
                <div className="chat-interface flex flex-col h-full w-full">
                    <div className="messages flex-grow overflow-y-auto mb-2 h-full w-full">
                        {messages.map((message) => (
                            <div key={message.id} className={`p-2 flex ${message.user_type === 'broker' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`i p-2 rounded-lg ${message.user_type === 'broker' ? 'bg-blue-100 w-2/3' : message.user_type === 'system' ? 'bg-red-100' : 'bg-gray-100 w-2/3'}`}>
                                    <p>{message.message_body}</p>
                                    {message.user_type !== 'system' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {message.user_type === 'broker' ? 'Broker' : 'Shipper'} - {new Date(message.message_time || '').toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {!isChatEnded && (
                        <form onSubmit={handleSendMessage} className="send-message-form flex w-full">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-grow p-2 border border-gray-300 rounded-l-lg"
                            />
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-r-lg">
                                Send
                            </button>
                        </form>
                    )}
                    <button
                        onClick={handleEndChat}
                        className="bg-red-500 w-fit text-white px-4 py-2 mt-2 rounded-lg"
                    >
                        End Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;