import React, { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Database } from '@/lib/database.types';

const withNtsUser = (WrappedComponent: React.FC) => {
    const ComponentWithNtsUser = (props: any) => {
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

                console.log(`Checking user in nts_users table with auth_uid: ${session.user.id}`);

                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error(`Error checking user in nts_users:`, error.message);
                    setUserExists(false);
                } else {
                    console.log(`User found in nts_users:`, data);
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

    ComponentWithNtsUser.displayName = `WithNtsUser(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return ComponentWithNtsUser;
};

export default withNtsUser;