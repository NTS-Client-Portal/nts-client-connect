import React, { useState, useEffect, useCallback } from 'react';
import QuotePage from '@/components/user/QuotePage';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import UserLayout from '@/pages/components/UserLayout';

const QuoteFormPage: React.FC = () => {
    const session = useSession();
    const router = useRouter();
    const supabase = useSupabaseClient<Database>();
    const { userProfile: profilesUser } = useProfilesUser();
    const [companyId, setCompanyId] = useState<string>('');
    const [assignedSalesUser, setAssignedSalesUser] = useState<string>('');
    const [ntsUserProfile, setNtsUserProfile] = useState<Database['public']['Tables']['nts_users']['Row'] | null>(null);

    const handleClose = () => {
        router.push('/'); // Redirect to the home page or any other page
    };

    const fetchQuotes = async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Error fetching quotes:', error.message);
        } else {
            console.log('Fetched Quotes:', data);
        }
    };

    const addQuote = async (quote: Partial<Database['public']['Tables']['shippingquotes']['Insert'] & { containerLength?: number | null; containerType?: string | null; contentsDescription?: string | null; selectedOption?: string | null; }>) => {
        if (!session?.user?.id) return;

        console.log('Adding quote:', quote);

        const { data: shippingQuoteData, error: shippingQuoteError } = await supabase
            .from('shippingquotes')
            .insert([{
                ...quote,
                user_id: session.user.id,
                company_id: quote.company_id || companyId,
                first_name: quote.first_name || null,
                last_name: quote.last_name || null,
                email: quote.email || null,
                inserted_at: quote.inserted_at || new Date().toISOString(),
                is_complete: quote.is_complete || false,
                is_archived: quote.is_archived || false,
                year: quote.year?.toString() || null,
                make: quote.make || null,
                model: quote.model || null,
                length: quote.length?.toString() || null,
                width: quote.width?.toString() || null,
                height: quote.height?.toString() || null,
                weight: quote.weight?.toString() || null,
                status: quote.status || 'Quote',
            }])
            .select();

        if (shippingQuoteError) {
            console.error('Error adding quote:', shippingQuoteError.message);
            return;
        }

        console.log('Quote added successfully:', shippingQuoteData);
        fetchQuotes();
    };

    const fetchUserProfile = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error.message);
            return;
        }

        setCompanyId(profile.company_id);
    }, [session, supabase]);

    const fetchNtsUserProfile = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data: ntsUser, error } = await supabase
            .from('nts_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching NTS user profile:', error.message);
            return;
        }

        setNtsUserProfile(ntsUser);
    }, [session, supabase]);

    useEffect(() => {
        fetchUserProfile();
        fetchNtsUserProfile();
    }, [fetchUserProfile, fetchNtsUserProfile]);

    useEffect(() => {
        if (session?.user?.id) {
            setAssignedSalesUser(session.user.id);
        }
    }, [session]);

    return (
        <UserLayout>
            <QuotePage
                onClose={handleClose}
                addQuote={addQuote}
                errorText=""
                setErrorText={() => {}}
                session={session}
                companyId={companyId}
                fetchQuotes={fetchQuotes}
                assignedSalesUser={assignedSalesUser}
            />
        </UserLayout>
    );
};

export default QuoteFormPage;