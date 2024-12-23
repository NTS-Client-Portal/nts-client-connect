import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/initSupabase';
import { Session } from '@supabase/auth-helpers-react';

interface ChatInterfaceProps {
    brokerId: string;
    shipperId: string;
    session: Session | null;
}

interface Message {
    id: number;
    broker_id: string | null;
    shipper_id: string | null;
    message_body: string;
    message_time: string | null;
    user_type: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ brokerId, shipperId, session }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
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

    return (
        <div className="chat-interface">
            <div className="messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.user_type === (session?.user.id === brokerId ? 'broker' : 'shipper') ? 'sent' : 'received'}`}>
                        <p>{message.message_body}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="send-message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatInterface;