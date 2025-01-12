import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface InviteUserFormProps {
    companyId: string;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ companyId }) => {
    const supabase = useSupabaseClient<Database>();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companySize, setCompanySize] = useState<string | null>(null);
    const [industry, setIndustry] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            const { data, error } = await supabase
                .from('companies')
                .select('company_name, company_size, industry')
                .eq('id', companyId)
                .single();

            if (error) {
                console.error('Error fetching company information:', error.message);
            } else {
                setCompanyName(data.company_name);
                setCompanySize(data.company_size);
                setIndustry(data.industry);
            }
        };

        fetchCompanyInfo();
    }, [companyId, supabase]);

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/.netlify/functions/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    phoneNumber,
                    companyId,
                    companyName,
                    companySize,
                    industry,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            console.log('Profile created successfully');
            setSuccess(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <h2 className="text-2xl font-bold mb-4">Invite User</h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success ? (
                <div className="text-green-500 mb-4">User invited successfully!</div>
            ) : (
                <form onSubmit={handleInviteUser} className="w-full max-w-md">
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full body-btn"
                        disabled={loading}
                    >
                        {loading ? 'Inviting...' : 'Invite User'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default InviteUserForm;