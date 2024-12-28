import React from 'react';
import ShipperChatRequestsPage from '@/components/ShipperChatRequestsPage';
import UserLayout from '../../components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';

const ChatRequests: React.FC = () => {
    return (
        <ProfilesUserProvider>
            <UserLayout>
                <ShipperChatRequestsPage />
            </UserLayout>
        </ProfilesUserProvider>
    );
};

export default ChatRequests;