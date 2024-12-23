import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import SuperadminDashboard from "../components/Superdashboard";
import { NtsUsersProvider } from '@/context/NtsUsersContext';

const SuperadminDash = () => {
    const session = useSession();
    const router = useRouter();

    const checkSession = useCallback(() => {
        if (!session) {
            router.push("/superadmin-login");
        }
    }, [session, router]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    if (!session) {
        return <p>Loading...</p>; // or a loading spinner
    }

    return (
        <NtsUsersProvider>
            <SuperadminDashboard session={session} />
        </NtsUsersProvider>
    );
};

export default SuperadminDash;