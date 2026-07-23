import React from 'react';
import UserLayout from '@/pages/components/UserLayout';
import { ProfilesUserProvider } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import SavedLibrary from '@/components/user/library/SavedLibrary';

const SavedLibraryPage: React.FC = () => {
    return (
        <NtsUsersProvider>
            <ProfilesUserProvider>
                <UserLayout>
                    <div className="min-h-full bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
                        <SavedLibrary />
                    </div>
                </UserLayout>
            </ProfilesUserProvider>
        </NtsUsersProvider>
    );
};

export default SavedLibraryPage;
