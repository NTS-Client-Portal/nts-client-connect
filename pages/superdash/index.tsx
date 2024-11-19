import React from "react";
import SuperadminDashboard from "../components/Superdashboard";
import { UserProvider } from "../../context/UserContext";

const SuperadminDash = () => {
    return (
    <UserProvider>
        <SuperadminDashboard />
        </UserProvider>
);
};

export default SuperadminDash;