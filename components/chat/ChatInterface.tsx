import React, { useEffect, useState, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface ChatInterfaceProps {
    brokerId: string;
    shipperId: string;
    session: any;
    activeChatId: string | null;
}

interface Message {
    id: number;
    message_body: string;
    message_time: string | null;
    user_type: string | null;
}

const isValidUUID = (id: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ brokerId, shipperId, session, activeChatId }) => {
    const supabase = useSupabaseClient<Database>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatEnded, setIsChatEnded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isValidUUID(brokerId) || !isValidUUID(shipperId)) {
            console.error('Invalid brokerId or shipperId');
            return;
        }

        const fetchMessages = async () => {
            if (!activeChatId || !isValidUUID(activeChatId)) {
                console.error('Invalid activeChatId');
                return;
            }

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', activeChatId);

            if (error) {
                console.error('Error fetching messages:', error.message);
            } else {
                setMessages(data as Message[]);
            }
        };

        fetchMessages();

        const subscription = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [brokerId, shipperId, activeChatId, supabase]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Ensure brokerId and shipperId are valid UUIDs
        if (!isValidUUID(brokerId) || !isValidUUID(shipperId)) {
            console.error('Invalid brokerId or shipperId');
            return;
        }

        // Check if brokerId and shipperId exist in the respective tables
        const { data: brokerData, error: brokerError } = await supabase
            .from('nts_users')
            .select('id')
            .eq('id', brokerId)
            .single();

        if (brokerError || !brokerData) {
            console.error('Invalid brokerId:', brokerError?.message);
            return;
        }

        const { data: shipperData, error: shipperError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', shipperId)
            .single();

        if (shipperError || !shipperData) {
            console.error('Invalid shipperId:', shipperError?.message);
            return;
        }

        const { error } = await supabase
            .from('messages')
            .insert({
                chat_id: activeChatId,
                message_body: newMessage,
                user_type: 'shipper',
                message_time: new Date().toISOString(),
            });

        if (error) {
            console.error('Error sending message:', error.message);
        } else {
            setNewMessage('');
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <div className="bg-ntsBlue/90 p-3 rounded-lg shadow-lg w-full h-[600px] sm:h-[700px]">
                <div className="chat-interface flex flex-col h-full w-full">
                    <div className="messages rounded-t-md flex-grow overflow-y-auto pb-2 border border-zinc-300 h-full w-full">
                        {messages.map((message) => (
                            <div key={message.id} className={`p-2 flex ${message.user_type === 'broker' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`p-2 rounded-lg ${message.user_type === 'broker' ? 'bg-blue-100 w-3/4 sm:w-1/2 ml-2' : message.user_type === 'system' ? 'bg-red-100' : 'bg-gray-100 w-3/4 sm:w-1/2 mr-2'}`}>
                                    <p>{message.message_body}</p>
                                    {message.user_type !== 'system' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {message.user_type === 'broker' ? 'Broker' : 'Shipper'} - {new Date(message.message_time || '').toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isChatEnded && (
                            <div className="flex justify-center items-center w-full my-4">
                                <div className="border-t border-gray-300 w-full text-center">
                                    <span className="bg-white px-4 text-gray-500">Chat session has ended</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {!isChatEnded && (
                        <>
                            <form onSubmit={handleSendMessage} className="send-message-form rounded-b-md flex w-full">
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
                            <button
                                onClick={handleEndChat}
                                className="bg-red-500 w-full sm:w-fit text-white px-4 py-2 mt-2 rounded-lg"
                            >
                                End Chat
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;