import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import ArchivedTable from './ArchivedTable';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface ArchivedProps {
    session: Session | null;
    selectedUserId: string;
    isAdmin: boolean;
    companyId: string; // Add companyId as a prop
}

const Archived: React.FC<ArchivedProps> = ({ session, isAdmin, companyId }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [archivedQuotes, setArchivedQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [isNtsUser, setIsNtsUser] = useState<boolean>(false);
    const [isCompanyUser, setIsCompanyUser] = useState<boolean>(false);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'asc' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchColumn, setSearchColumn] = useState<string>('id');

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
            .eq('status', 'Archived')
            .is('is_archived', true);

        if (quotesError) {
            console.error('Error fetching quotes for nts_user:', quotesError.message);
            return [];
        }

        return quotes;
    }, [supabase]);

    const fetchQuotesForCompany = useCallback(async (companyId: string) => {
        const { data: quotes, error: quotesError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'Archived')
            .is('is_archived', true);

        if (quotesError) {
            console.error('Error fetching quotes for company:', quotesError.message);
            return [];
        }

        return quotes;
    }, [supabase]);

    const fetchArchivedQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isAdmin) {
            const quotesData = await fetchQuotesForNtsUsers(session.user.id);
            setArchivedQuotes(quotesData);
        } else {
            const quotesData = await fetchQuotesForCompany(companyId);
            setArchivedQuotes(quotesData);
        }

        setIsLoading(false);
    }, [session, supabase, fetchQuotesForCompany, fetchQuotesForNtsUsers, isAdmin, companyId]);

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
                    setIsNtsUser(true);
                    const quotes = await fetchQuotesForNtsUsers(session.user.id);
                    setArchivedQuotes(quotes);
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
                    setIsCompanyUser(true);
                    const quotes = await fetchQuotesForCompany(profileData.company_id);
                    setArchivedQuotes(quotes);
                    return;
                }

                fetchArchivedQuotes();
            }
        };

        checkUserType();
    }, [session, fetchQuotesForNtsUsers, fetchArchivedQuotes, fetchQuotesForCompany, companyId]);

    useEffect(() => {
        fetchArchivedQuotes();
    }, [fetchArchivedQuotes]);

    useEffect(() => {
        const channel = supabase
            .channel('shippingquotes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shippingquotes' },
                (payload) => {
                    console.log('Change received!', payload);
                    if (payload.eventType === 'UPDATE' && payload.new.is_archived) {
                        fetchArchivedQuotes();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup subscription
        };
    }, [supabase, fetchArchivedQuotes]);

    const unArchive = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                due_date: null, // Require the user to fill out a new shipping date
                status: 'Quote', // Set the status back to 'Quote'
            })
            .select();

        if (error) {
            console.error('Error duplicating quote:', error.message);
        } else {
            if (data && data.length > 0) {
                setPopupMessage(`Duplicate Quote Request Added - Quote #${data[0].id}`);
            }
            fetchArchivedQuotes();
        }
    };

    return (
        <div className="w-full bg-white0 max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden 2xl:block overflow-x-auto">
                <ArchivedTable
                    quotes={archivedQuotes}
                    sortConfig={sortConfig}
                    handleSort={() => { }}
                    unArchive={unArchive}
                    handleStatusChange={() => { }}
                    isAdmin={isAdmin}
                    isNtsUser={isNtsUser}
                    isCompanyUser={isCompanyUser}
                    companyId={companyId}
                />
            </div>
            <div className="block md:hidden">
                {archivedQuotes.map((quote) => (
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

export default Archived;