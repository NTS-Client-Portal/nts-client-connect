import SuperadminLogin from "../components/SuperadminLogin";
import { UserProvider } from "../../context/UserContext";

const SuperadminLoginPage = () => {
    return (
    <UserProvider>
        <SuperadminLogin />
        </UserProvider>
    );
}

export default SuperadminLoginPage;