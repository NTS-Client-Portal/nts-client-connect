import React, { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';

const withProfile = (WrappedComponent: React.FC) => {
    const ComponentWithProfile = (props: any) => {
        const session = useSession();
        const supabase = useSupabaseClient<Database>();
        const router = useRouter();
        const [userExists, setUserExists] = useState<boolean>(false);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const checkUserExists = async () => {
                if (!session) {
                    console.log('No session found');
                    setLoading(false);
                    return;
                }

                console.log(`Checking user in profiles table with auth_uid: ${session.user.id}`);

                const { data, error } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('auth_uid', session.user.id)
                    .single();

                if (error) {
                    console.error(`Error checking user in profiles:`, error.message);
                    setUserExists(false);
                } else {
                    console.log(`User found in profiles:`, data);
                    setUserExists(!!data);
                }

                setLoading(false);
            };

            checkUserExists();
        }, [session, supabase]);

        if (loading) {
            return <p>Loading...</p>;
        }

        if (!userExists) {
            router.push('/unauthorized'); // Redirect to an unauthorized page
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    ComponentWithProfile.displayName = `WithProfile(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return ComponentWithProfile;
};

export default withProfile;