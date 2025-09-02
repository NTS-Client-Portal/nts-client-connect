import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import RejectedTable from './RejectedTable';
import RejectedDetailsMobile from '../mobile/RejectedDetailsMobile';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';

interface RejectedProps {
    session: Session | null;
    selectedUserId: string;
    fetchQuotes: () => void;
    isAdmin: boolean;
    companyId: string;
    refreshTrigger?: number; // Add optional refresh trigger
    duplicateQuote?: (quote: Quote) => void;
    reverseQuote?: (quote: Quote) => void;
}

type Quote = Database['public']['Tables']['shippingquotes']['Row'];

const RejectedList: React.FC<RejectedProps> = ({ session, isAdmin, selectedUserId, companyId, refreshTrigger, duplicateQuote, reverseQuote }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [rejectedQuotes, setRejectedQuotes] = useState<Quote[]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [getStatusClasses] = useState(() => (status: string) => 'bg-gray-100 text-gray-800');

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
        []
    );

    const fetchRejectedQuotes = useCallback(
        async (profileIds: string[]) => {
            console.log('Fetching rejected quotes for profile IDs:', profileIds);
            const { data: quotes, error } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("user_id", profileIds)
                .eq("status", "Rejected");

            if (error) {
                console.error("Error fetching rejected quotes:", error.message);
                return [];
            }

            console.log('Found rejected quotes:', quotes);
            return quotes;
        },
        []
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

            const profilesData = await fetchProfiles(companyId);
            const profileIds = profilesData.map((profile) => profile.id);

            const { data: quotes, error: quotesError } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("user_id", profileIds)
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
        [fetchProfiles]
    );

    const fetchInitialQuotes = useCallback(async () => {
        console.log('fetchInitialQuotes called with refreshTrigger:', refreshTrigger);
        if (!session?.user?.id) return;

        if (isAdmin) {
            const quotesData = await fetchRejectedQuotesForNtsUsers(session.user.id, companyId);
            console.log('Admin rejected quotes:', quotesData);
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
        fetchProfiles,
        fetchRejectedQuotes,
        fetchRejectedQuotesForNtsUsers,
        isAdmin,
        companyId,
    ]);

    useEffect(() => {
        fetchInitialQuotes();
    }, [fetchInitialQuotes, refreshTrigger]); // Add refreshTrigger to dependencies

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
    }, [session, fetchRejectedQuotesForNtsUsers, fetchRejectedQuotes, fetchInitialQuotes, fetchProfiles, companyId]);

    const duplicateQuoteInternal = async (quote: Quote) => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                due_date: null,
                price: null,
                status: 'Quote', // Reset to Quote status
                created_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error('Error duplicating quote:', error.message);
        } else {
            if (data && data.length > 0) {
                setPopupMessage(`Duplicate Quote Request Added - Quote #${data[0].id}`);
            }
            fetchInitialQuotes();
        }
    };

    const reverseQuoteInternal = async (quote: Quote) => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                due_date: null,
                price: null,
                status: 'Quote', // Reset to Quote status
                origin_city: quote.destination_city,
                origin_state: quote.destination_state,
                origin_zip: quote.destination_zip,
                destination_city: quote.origin_city,
                destination_state: quote.origin_state,
                destination_zip: quote.origin_zip,
                created_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error('Error reversing quote:', error.message);
        } else {
            if (data && data.length > 0) {
                setPopupMessage(`Flip Route Duplicate Request Added - Quote #${data[0].id}`);
            }
            fetchInitialQuotes();
        }
    };

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

    // Popup message auto-hide effect
    useEffect(() => {
        if (popupMessage) {
            const timer = setTimeout(() => {
                setPopupMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [popupMessage]);

    return (
        <div className="w-full bg-white0 max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            {!!popupMessage && <div className="text-green-500 mb-4 p-3 bg-green-50 border border-green-200 rounded">{popupMessage}</div>}
            <div className="hidden lg:block overflow-x-auto">
                <RejectedTable
                    quotes={rejectedQuotes}
                    sortConfig={{ column: 'id', order: 'asc' }}
                    handleSort={() => { }}
                    handleStatusChange={() => { }}
                    unRejectQuote={unRejectQuote}
                    isAdmin={isAdmin}
                    duplicateQuote={duplicateQuote || duplicateQuoteInternal}
                    reverseQuote={reverseQuote || reverseQuoteInternal}
                />
            </div>
            <div className="block md:hidden">
                <RejectedDetailsMobile
                    quotes={rejectedQuotes}
                    unRejectQuote={unRejectQuote}
                    duplicateQuote={duplicateQuote || duplicateQuoteInternal}
                    reverseQuote={reverseQuote || reverseQuoteInternal}
                    formatDate={formatDate}
                    getStatusClasses={getStatusClasses}
                />
            </div>
        </div>
    );
};

export default RejectedList;