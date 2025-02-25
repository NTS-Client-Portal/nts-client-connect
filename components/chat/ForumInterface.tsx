import React, { useEffect, useState, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface ForumInterfaceProps {
    brokerId: string;
    shipperId: string;
    session: any;
    ticketId: number;
}

interface Message {
    id: number;
    message_body: string;
    message_time: string | null;
    broker_id: string;
    shipper_id: string;
    user_type: string | null;
    file_url: string | null;
}

interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
}

const ForumInterface: React.FC<ForumInterfaceProps> = ({ brokerId, shipperId, session, ticketId }) => {
    const supabase = useSupabaseClient<Database>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [userProfiles, setUserProfiles] = useState<{ [key: string]: UserProfile }>({});
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('message_time', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error.message);
        } else {
            setMessages(data.map((msg) => ({
                id: msg.id,
                message_body: msg.message_body,
                message_time: msg.message_time,
                broker_id: msg.broker_id,
                shipper_id: msg.shipper_id,
                user_type: msg.user_type,
                file_url: msg.file_url,
            })));
        }
    };

    const fetchUserProfiles = async (userIds: string[], userType: string) => {
        const table = userType === 'broker' ? 'nts_users' : 'profiles';
        const { data, error } = await supabase
            .from(table)
            .select('id, first_name, last_name')
            .in('id', userIds);

        if (error) {
            console.error(`Error fetching ${userType} profiles:`, error.message);
        } else {
            const profiles = data.reduce((acc: { [key: string]: UserProfile }, profile: UserProfile) => {
                acc[profile.id] = profile;
                return acc;
            }, {});
            setUserProfiles((prevProfiles) => ({ ...prevProfiles, ...profiles }));
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [ticketId, supabase, session.user.id]);

    useEffect(() => {
        const brokerIds = messages.filter((msg) => msg.user_type === 'broker').map((msg) => msg.broker_id);
        const shipperIds = messages.filter((msg) => msg.user_type === 'shipper').map((msg) => msg.shipper_id);
        if (brokerIds.length > 0) fetchUserProfiles(brokerIds, 'broker');
        if (shipperIds.length > 0) fetchUserProfiles(shipperIds, 'shipper');
    }, [messages]);

    useEffect(() => {
        const subscription = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                setMessages((prevMessages) => [...prevMessages, payload.new as Message]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [supabase]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && !file) return;

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

        const { error } = await supabase
            .from('messages')
            .insert({
                message_body: newMessage,
                ticket_id: ticketId,
                broker_id: brokerId,
                shipper_id: shipperId,
                user_type: session.user.id === brokerId ? 'broker' : 'shipper',
                file_url: fileUrl,
                message_time: new Date().toISOString(),
            });

        if (error) {
            console.error('Error sending message:', error.message);
        } else {
            setNewMessage('');
            setFile(null);
            // No need to fetch messages again as the subscription will handle it
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="">
            <div className=" w-full">
                <div className="flex flex-col h-full w-full">
                    <form onSubmit={handleSendMessage} className="bg-white shadow-md p-2 flex flex-col w-full my-2">
                        <div className="flex-grow">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-grow p-2 rounded-t-lg"
                                style={{ height: '150px' }} // Double the height of the text area
                            />
                        </div>
                        <div className='flex flex-col md:flex-row md:justify-between items-center h-full w-full mt-20 md:mt-10'>
                            <div className='w-full md:w-1/2'>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="text-ntsBlue mt-10 md:mt-0"
                                />
                            </div>
                            <div className='w-full md:w-1/2 flex justify-end mt-8 md:mt-0'>
                                <button type="submit" className="bg-ntsLightBlue text-white w-full md:w-5/6 px-4 py-2 rounded-lg">
                                    Post
                                </button>
                            </div>
                        </div>
                    </form>
                    <div className="flex-grow border-2 shadow-md h-full w-full mt-4 overflow-y-auto">
                        {messages.map((message) => (
                            <div key={message.id} className={`p-1 flex w-full bg-ntsBlue/80 border-2 border-t-orange-500 text-white`}>
                                <div className={`p-2 rounded-lg w-full`}>
                                    {message.user_type && userProfiles[message.user_type === 'broker' ? message.broker_id : message.shipper_id] && (
                                        <p className="text-xs text-gray-200 italic underline">
                                            {userProfiles[message.user_type === 'broker' ? message.broker_id : message.shipper_id].first_name} {userProfiles[message.user_type === 'broker' ? message.broker_id : message.shipper_id].last_name} - {new Date(message.message_time || '').toLocaleTimeString()}
                                        </p>
                                    )}
                                    <div dangerouslySetInnerHTML={{ __html: message.message_body }} />
                                    {message.file_url && (
                                        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${message.file_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                            View Attachment
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForumInterface;