import React, { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
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
                    router.push('/unauthorized');
                    return;
                }

                console.log(`Checking user in nts_users table with id: ${session.user.id}`);

                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) {
                    console.error(`Error checking user in nts_users:`, error.message);
                    setUserExists(false);
                    router.push('/unauthorized');
                } else {
                    if (data) {
                        console.log(`User found in nts_users:`, data);
                        setUserExists(true);
                    } else {
                        console.log('No user found in nts_users');
                        setUserExists(false);
                        router.push('/unauthorized');
                    }
                }

                setLoading(false);
            };

            checkUserExists();
        }, [session?.user?.id, supabase, router]);

        if (loading) {
            return <p>Loading...</p>;
        }

        if (!userExists) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    ComponentWithNtsUser.displayName = `WithNtsUser(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return ComponentWithNtsUser;
};

export default withNtsUser;