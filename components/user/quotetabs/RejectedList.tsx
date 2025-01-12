import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
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

    const fetchProfiles = useCallback(
        async (companyId: string) => {
            console.log('Fetching profiles for companyId:', companyId); // Add log to check companyId

            const { data: profiles, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("company_id", companyId);

            if (error) {
                console.error("Error fetching profiles:", error.message);
                return [];
            }

            return profiles;
        },
        [supabase]
    );

    const fetchRejectedQuotes = useCallback(
        async (profileIds: string[]) => {
            const { data: quotes, error } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("user_id", profileIds)
                .eq("status", "Rejected");

            if (error) {
                console.error("Error fetching rejected quotes:", error.message);
                return [];
            }

            return quotes;
        },
        [supabase]
    );

    const fetchRejectedQuotesForNtsUsers = useCallback(
        async (userId: string, companyId: string) => {
            console.log('Fetching rejected quotes for nts_user with companyId:', companyId); // Add log to check companyId

            const { data: companySalesUsers, error: companySalesUsersError } = await supabase
                .from("company_sales_users")
                .select("company_id")
                .eq("sales_user_id", userId);

            if (companySalesUsersError) {
                console.error(
                    "Error fetching company_sales_users for nts_user:",
                    companySalesUsersError.message
                );
                return [];
            }

            const companyIds = companySalesUsers.map(
                (companySalesUser) => companySalesUser.company_id
            );

            if (!companyIds.includes(companyId)) {
                console.error("Company ID not assigned to the user");
                return [];
            }

            const { data: quotes, error: quotesError } = await supabase
                .from("shippingquotes")
                .select("*")
                .eq("company_id", companyId)
                .eq("status", "Rejected");

            if (quotesError) {
                console.error(
                    "Error fetching rejected quotes for nts_user:",
                    quotesError.message
                );
                return [];
            }

            return quotes;
        },
        [supabase]
    );

    const fetchInitialQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isAdmin) {
            const quotesData = await fetchRejectedQuotesForNtsUsers(session.user.id, companyId);
            setRejectedQuotes(quotesData);
        } else {
            // Fetch the user's profile
            const { data: userProfile, error: userProfileError } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", session.user.id)
                .single();

            if (userProfileError) {
                console.error("Error fetching user profile:", userProfileError.message);
                return;
            }

            if (!userProfile) {
                console.error("No profile found for user");
                return;
            }

            const companyId = userProfile.company_id;
            const profilesData = await fetchProfiles(companyId);

            const profileIds = profilesData.map((profile) => profile.id);
            const quotesData = await fetchRejectedQuotes(profileIds);

            setRejectedQuotes(quotesData);
        }
    }, [
        session,
        supabase,
        fetchProfiles,
        fetchRejectedQuotes,
        fetchRejectedQuotesForNtsUsers,
        isAdmin,
        companyId,
    ]);

    useEffect(() => {
        fetchInitialQuotes();
    }, [fetchInitialQuotes]);

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
                    const quotes = await fetchRejectedQuotesForNtsUsers(session.user.id, companyId);
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
                    const profilesData = await fetchProfiles(profileData.company_id);
                    const profileIds = profilesData.map((profile) => profile.id);
                    const quotes = await fetchRejectedQuotes(profileIds);
                    setRejectedQuotes(quotes);
                    return;
                }

                fetchInitialQuotes();
            }
        };
        

        checkUserType();
    }, [session, fetchRejectedQuotesForNtsUsers, fetchRejectedQuotes, fetchInitialQuotes, companyId]);

    useEffect(() => {
        const channel = supabase
            .channel('shippingquotes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shippingquotes' },
                (payload) => {
                    console.log('Change received!', payload);
                    if (payload.eventType === 'UPDATE' && payload.new.status === 'Archived') {
                        fetchInitialQuotes();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup subscription
        };
    }, [fetchInitialQuotes]);

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