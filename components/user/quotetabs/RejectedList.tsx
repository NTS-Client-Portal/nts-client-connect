import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import { formatDate, freightTypeMapping } from './QuoteUtils';
import RejectedTable from './RejectedTable';

interface RejectedProps {
    session: Session | null;
    selectedUserId: string;
    fetchQuotes: () => void;
    isAdmin: boolean;
    companyId: string;
}

type Quote = Database['public']['Tables']['shippingquotes']['Row'];

const RejectedList: React.FC<RejectedProps> = ({ session, isAdmin, selectedUserId, companyId }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [rejectedQuotes, setRejectedQuotes] = useState<Quote[]>([]);

    const fetchQuotesForNtsUsers = useCallback(async (userId: string) => {
        const { data: companyIdsData, error: companyIdsError } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .eq('sales_user_id', userId);

        if (companyIdsError) {
            console.error('Error fetching company IDs:', companyIdsError.message);
            return [];
        }

        const companyIds = companyIdsData.map((item: any) => item.company_id);

        if (companyIds.length === 0) {
            return [];
        }

        const { data: quotes, error: quotesError } = await supabase
            .from('shippingquotes')
            .select('*')
            .in('company_id', companyIds)
            .eq('status', 'Rejected');

        if (quotesError) {
            console.error('Error fetching quotes for nts_user:', quotesError.message);
            return [];
        }

        return quotes;
    }, []);

    const fetchQuotesForCompany = useCallback(async (companyId: string) => {
        if (!companyId) {
            console.error('Invalid company ID');
            return [];
        }

        const { data: quotes, error: quotesError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'Rejected');

        if (quotesError) {
            console.error('Error fetching quotes for company:', quotesError.message);
            return [];
        }

        return quotes;
    }, []);

    const fetchRejectedQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isAdmin) {
            const quotesData = await fetchQuotesForNtsUsers(session.user.id);
            setRejectedQuotes(quotesData);
        } else if (companyId) {
            const quotesData = await fetchQuotesForCompany(companyId);
            setRejectedQuotes(quotesData);
        }

        setIsLoading(false);
    }, [session, fetchQuotesForCompany, fetchQuotesForNtsUsers, isAdmin, companyId]);

    useEffect(() => {
        const checkUserType = async () => {
            if (session?.user?.id) {
                const { data: ntsUserData, error: ntsUserError } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single();

                if (ntsUserError) {
                    console.error('Error fetching nts_user role:', ntsUserError.message);
                } else if (ntsUserData) {
                    const quotes = await fetchQuotesForNtsUsers(session.user.id);
                    setRejectedQuotes(quotes);
                    return;
                }

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError.message);
                } else if (profileData?.company_id) {
                    const quotes = await fetchQuotesForCompany(profileData.company_id);
                    setRejectedQuotes(quotes);
                    return;
                }

                fetchRejectedQuotes();
            }
        };

        checkUserType();
    }, [session, fetchQuotesForNtsUsers, fetchRejectedQuotes, fetchQuotesForCompany, companyId]);

    useEffect(() => {
        fetchRejectedQuotes();
    }, [fetchRejectedQuotes]);

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
            <div className="hidden lg:block overflow-x-auto">
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