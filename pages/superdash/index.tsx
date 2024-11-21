import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "@supabase/auth-helpers-react";
import SuperadminDashboard from "../components/Superdashboard";
import { UserProvider } from "../../context/UserContext";

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
        <UserProvider>
            <SuperadminDashboard session={session}/>
        </UserProvider>
    );
};

export default SuperadminDash;