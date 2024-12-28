import React from 'react';
import ChatRequestsPage from '@/components/ChatRequestsPage';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

const ChatRequests: React.FC = () => {
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <ChatRequestsPage />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default ChatRequests;