import React, { useEffect, useState, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ForumInterfaceProps {
    brokerId: string;
    shipperId: string;
    session: any;
}

interface Message {
    id: number;
    message_body: string;
    message_time: string | null;
    user_type: string | null;
    file_url: string | null;
}

const ForumInterface: React.FC<ForumInterfaceProps> = ({ brokerId, shipperId, session }) => {
    const supabase = useSupabaseClient<Database>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('support_ticket')
            .select('*')
            .or(`broker_id.eq.${brokerId},shipper_id.eq.${shipperId}`)
            .order('request_time', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error.message);
        } else {
            setMessages(data.map((msg) => ({
                id: msg.id,
                message_body: msg.message,
                message_time: msg.request_time,
                user_type: session.user.id === brokerId ? 'broker' : 'shipper',
                file_url: msg.file_url,
            })));
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [brokerId, shipperId, supabase, session.user.id]);

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
            .from('support_ticket')
            .insert({
                message: newMessage,
                broker_id: brokerId,
                shipper_id: shipperId,
                file_url: fileUrl,
                support_type: 'broker_support', // Adjust this as needed
                request_time: new Date().toISOString(),
                topic: 'Chat Message', // Adjust this as needed
            });

        if (error) {
            console.error('Error sending message:', error.message);
        } else {
            setNewMessage('');
            setFile(null);
            fetchMessages(); // Fetch messages again to update the list
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
        <div className="container mx-auto p-4 sm:p-6">
            <div className="bg-ntsBlue/90 p-3 w-full">
                <div className="flex flex-col h-full w-full">
                    <form onSubmit={handleSendMessage} className="bg-white rounded-md flex flex-col w-full mt-2">
                        <div className="flex-grow">
                            <ReactQuill
                                value={newMessage}
                                onChange={setNewMessage}
                                className="flex-grow p-2 rounded-t-lg"
                                style={{ height: '200px' }} // Double the height of the text area
                            />
                        </div>
                        <div className='flex justify-around items-center w-full mt-10'>
                            <div>
                            <label className="text-white">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="p-2 mt-2 bg-ntsBlue text-white rounded-lg"
                                />
                                Upload related files</label>
                            </div>
                            <div className='w-1/4'>
                                <button type="submit" className="bg-ntsLightBlue text-white w-full px-4 py-2 rounded-lg mt-2">
                                    Post
                                </button>
                            </div>
                        </div>
                    </form>
                    <div className="flex-grow border border-zinc-300 h-full w-full">
                        {messages.map((message) => (
                            <div key={message.id} className={`p-2 flex w-full bg-white border border-zinc-300`}>
                                <div className={`p-2 rounded-lg w-full`}>
                                    <div dangerouslySetInnerHTML={{ __html: message.message_body }} />
                                    {message.file_url && (
                                        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${message.file_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                            View Attachment
                                        </a>
                                    )}
                                    {message.user_type !== 'system' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {message.user_type === 'broker' ? 'Broker' : 'Shipper'} - {new Date(message.message_time || '').toLocaleTimeString()}
                                        </p>
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