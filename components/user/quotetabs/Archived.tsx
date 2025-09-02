import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';
import ArchivedTable from './ArchivedTable';
import ArchivedDetailsMobile from '../mobile/ArchivedDetailsMobile';
import { formatDate, renderAdditionalDetails, freightTypeMapping } from './QuoteUtils';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

interface ArchivedProps {
    session: Session | null;
    selectedUserId: string;
    isAdmin: boolean;
    companyId: string | null;
    fetchQuotes: () => void;
}

const Archived: React.FC<ArchivedProps> = ({ session, isAdmin, companyId, fetchQuotes }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [archivedQuotes, setArchivedQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [isNtsUser, setIsNtsUser] = useState<boolean>(false);
    const [isCompanyUser, setIsCompanyUser] = useState<boolean>(false);
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string }>({ column: 'id', order: 'asc' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchColumn, setSearchColumn] = useState<string>('id');
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

    const fetchArchivedQuotes = useCallback(
        async (profileIds: string[]) => {
            const { data: quotes, error } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("user_id", profileIds)
                .eq("status", "Archived");

            if (error) {
                console.error("Error fetching archived quotes:", error.message);
                return [];
            }

            return quotes;
        },
        []
    );

    const fetchArchivedQuotesForNtsUsers = useCallback(
        async (userId: string, companyId: string) => {
            console.log('Fetching archived quotes for nts_user with companyId:', companyId); // Add log to check companyId

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
                .eq("status", "Archived");

            if (quotesError) {
                console.error(
                    "Error fetching archived quotes for nts_user:",
                    quotesError.message
                );
                return [];
            }

            return quotes;
        },
        []
    );

    const fetchInitialQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isAdmin) {
            const quotesData = await fetchArchivedQuotesForNtsUsers(session.user.id, companyId);
            setArchivedQuotes(quotesData);
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
            const quotesData = await fetchArchivedQuotes(profileIds);

            setArchivedQuotes(quotesData);
        }
    }, [
        session,
        fetchProfiles,
        fetchArchivedQuotes,
        fetchArchivedQuotesForNtsUsers,
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
                    const quotes = await fetchArchivedQuotesForNtsUsers(session.user.id, companyId);
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
                    const profilesData = await fetchProfiles(profileData.company_id);
                    const profileIds = profilesData.map((profile) => profile.id);
                    const quotes = await fetchArchivedQuotes(profileIds);
                    setArchivedQuotes(quotes);
                    return;
                }

                fetchInitialQuotes();
            }
        };

        checkUserType();
    }, [fetchArchivedQuotesForNtsUsers, fetchArchivedQuotes, fetchInitialQuotes, companyId, fetchProfiles, session?.user?.id]);

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
            fetchInitialQuotes();
        }
    };

    const duplicateQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
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

    const reverseQuote = async (quote: Database['public']['Tables']['shippingquotes']['Row']) => {
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

    return (
        <div className="w-full bg-white max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden lg:block overflow-x-auto">
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
                    duplicateQuote={duplicateQuote}
                    reverseQuote={reverseQuote}
                />
            </div>
            <div className="block md:hidden">
                <ArchivedDetailsMobile
                    quotes={archivedQuotes}
                    restoreQuote={unArchive}
                    duplicateQuote={duplicateQuote}
                    reverseQuote={reverseQuote}
                    formatDate={formatDate}
                    getStatusClasses={getStatusClasses}
                />
            </div>
        </div>
    );
};

export default Archived;