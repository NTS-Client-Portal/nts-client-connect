import React, { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import QuoteRequest from '@/components/user/QuoteRequest';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

const FreightRFQPage: React.FC = () => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const profiles = [];
    const ntsUsers = [];
    const isAdmin = false;

    useEffect(() => {
        const fetchCompanyId = async () => {
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }

            try {
                // Fetch the company_id from the profiles table
                const { data, error } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching company ID:', error.message);
                } else {
                    setCompanyId(data?.company_id || null);
                }
            } catch (err) {
                console.error('Unexpected error fetching company ID:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyId();
    }, [session, supabase]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!companyId) {
        return <p>Error: Unable to fetch company information.</p>;
    }

    return (
        <NtsUsersProvider>
            <ProfilesUserProvider>
                <UserLayout>
                    <QuoteRequest
                        session={session}
                        profiles={profiles}
                        companyId={companyId} // Pass the dynamically fetched companyId
                        userType="shipper"
                    />
                </UserLayout>
            </ProfilesUserProvider>
        </NtsUsersProvider>
    );
};

export default FreightRFQPage;