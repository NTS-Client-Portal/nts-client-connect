import Head from 'next/head';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import UserLayout from '@/pages/components/UserLayout';
import AdminLayout from '@/pages/components/admin-portal/AdminLayout';
import { UserProvider, useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import FreightInventory from '@/components/FreightInventory';
import AdminQuoteRequests from '@/components/admin/AdminQuoteRequests';
import withProfileCheck from '@/components/hoc/withProfileCheck';
import { useRouter } from 'next/router';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    inserted_at: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    profile_picture?: string | null;
    address?: string | null;
    phone_number?: string | null;
}

const HomePageContent = () => {
    const { userProfile } = useUser();

    return (
        <>
            <Head>
                <title>NTS Client Portal</title>
                <meta name="description" content="Welcome to SSTA Reminders & Tasks" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/hc-28.png" />
            </Head>
            <div className="w-full flex justify-center items-center p-4">
                <div className="w-full sm:w-2/3 lg:w-3/4">
                    <FreightInventory session={useSession()} />
                    {userProfile?.role === 'admin' && <AdminQuoteRequests />}
                </div>
            </div>
        </>
    );
};

const DashboardPage = () => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const createUserProfile = async () => {
            if (session?.user) {
                const { id, email } = session.user;

                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('id, email, role, inserted_at')
                    .eq('email', email)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') {
                    console.error(`Error checking user ${id}:`, checkError.message);
                    return;
                }

                if (existingUser) {
                    setUserProfile(existingUser as UserProfile);
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .insert({
                        id,
                        email,
                        role: 'user',
                        inserted_at: new Date().toISOString(),
                    })
                    .select();

                if (error) {
                    console.error('Error creating/updating user profile:', error.message);
                } else {
                    setUserProfile(data[0] as UserProfile);
                }
            }
        };

        if (session) {
            createUserProfile();
        }
    }, [session, supabase]);

    useEffect(() => {
        if (userProfile) {
            if (userProfile.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/user/freight-rfq');
            }
        }
    }, [userProfile, router]);

    if (!session) {
        return <div>Loading...</div>;
    }

    return (
        <UserProvider>
            {userProfile?.role === 'admin' ? (
                <AdminLayout>
                    <HomePageContent />
                </AdminLayout>
            ) : (
                <UserLayout>
                    <HomePageContent />
                </UserLayout>
            )}
        </UserProvider>
    );
};

export default withProfileCheck(DashboardPage);