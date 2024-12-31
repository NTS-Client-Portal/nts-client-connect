import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import { formatDate, freightTypeMapping } from './QuoteUtils';
import RejectedTable from './RejectedTable';

interface RejectedProps {
    session: Session | null;
    selectedUserId: string;
    isAdmin: boolean;
}

type Quote = Database['public']['Tables']['shippingquotes']['Row'];

const RejectedList: React.FC<RejectedProps> = ({ session, isAdmin, selectedUserId }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [rejectedQuotes, setRejectedQuotes] = useState<Quote[]>([]);

    useEffect(() => {
        if (!session) {
            return;
        }

        const fetchRejectedQuotes = async () => {
            const { data, error } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('status', 'Rejected')
                .eq('user_id', session.user.id);

            if (error) {
                setErrorText('Error fetching rejected quotes');
                return;
            }

            setRejectedQuotes(data as any);
            setIsLoading(false);
        }

        fetchRejectedQuotes();
    }, [session]);

    const unRejectQuote = async (quote: Quote) => {
        const { error } = await supabase
            .from('shippingquotes')
            .update({ status: 'Quote' })
            .eq('id', quote.id);

        if (error) {
            console.error('Error unrejecting quote:', error.message);
            return;
        }

        setRejectedQuotes(rejectedQuotes.filter((q) => q.id !== quote.id));
    }

    return (
        <div className="w-full bg-white0 max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden 2xl:block overflow-x-auto">
                <RejectedTable
                    quotes={rejectedQuotes}
                    sortConfig={{ column: 'id', order: 'asc' }}
                    handleSort={() => { }}
                    handleStatusChange={() => { }}
                    unRejectQuote={unRejectQuote}
                    isAdmin={isAdmin}
                />
            </div>
            <div className="block md:hidden">
                {rejectedQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">ID</div>
                            <div className="text-sm text-zinc-900">{quote.id}</div>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Origin</div>
                            <div className="text-sm text-zinc-900">
                                {quote.origin_city}, {quote.origin_state} {quote.origin_zip}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Destination</div>
                            <div className="text-sm text-zinc-900">{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Freight</div>
                            <div className="text-sm text-zinc-900">{quote.year} {quote.make} {quote.model}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Shipping Date</div>
                            <div className="text-sm text-zinc-900">{quote.due_date || 'No due date'}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Contact</div>
                            <div className="text-sm text-zinc-900">{quote.first_name} {quote.last_name} {quote.email}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Price</div>
                            <div className="text-sm text-zinc-900">{quote.price ? `$${quote.price}` : 'Not priced yet'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RejectedList;

