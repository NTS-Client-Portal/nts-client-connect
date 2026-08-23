import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { sendInvitations } from '@/lib/invitationService'; // Adjust the import path as needed
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4

const ProfileSetup = () => {
    const router = useRouter();
    const supabase = useSupabaseClient();
    const session = useSession();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(''); // Add phone number state
    const [inviteEmails, setInviteEmails] = useState<{ email: string, role: 'manager' | 'member' }[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'manager' | 'member'>('member');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState(session?.user?.email || ''); // Add email state

    useEffect(() => {
        if (!session?.user) return;

        const metadata = session.user.user_metadata ?? {};
        setEmail(session.user.email ?? '');
        setFirstName(metadata.first_name ?? '');
        setLastName(metadata.last_name ?? '');
        setCompanyName(metadata.company_name ?? '');
        setPhoneNumber(metadata.phone_number ?? '');
    }, [session]);

    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Ensure the company exists or create a new one
            let companyId: string;
            if (companyName) {
                const { data: existingCompany, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('name', companyName)
                    .maybeSingle();

                if (companyError && companyError.code !== 'PGRST116') {
                    throw new Error(companyError.message);
                }

                if (existingCompany) {
                    companyId = existingCompany.id;

                    // Update the existing company with missing fields (canonical name only)
                    const updates = {} as Partial<{
                        assigned_sales_user: string;
                        assigned_at: string;
                        name: string;
                        company_size: string;
                    }>;
                    if (!existingCompany.assigned_sales_user) updates.assigned_sales_user = '2b5928cc-4f66-4be4-8d76-4eb91c55db00';
                    if (!existingCompany.assigned_at) updates.assigned_at = new Date().toISOString();
                    if (!existingCompany.name) updates.name = companyName; // Use canonical name field
                    if (!existingCompany.company_size) updates.company_size = '1-10'; // Force default company size

                    if (Object.keys(updates).length > 0) {
                        console.log(`Updating existing company: ${companyName} with ID: ${companyId} with updates:`, updates);
                        const { error: updateCompanyError } = await supabase
                            .from('companies')
                            .update(updates)
                            .eq('id', companyId);

                        if (updateCompanyError) {
                            throw new Error(updateCompanyError.message);
                        }

                        console.log(`Updated existing company: ${companyName} with ID: ${companyId} in companies table`);
                    }
                } else {
                    companyId = uuidv4(); // Generate a unique ID for the new company
                    const assignedSalesUserId = '2b5928cc-4f66-4be4-8d76-4eb91c55db00'; // Default assigned sales user ID
                    const assignedAt = new Date().toISOString(); // Current timestamp
                    const { data: newCompany, error: newCompanyError } = await supabase
                        .from('companies')
                        .insert({
                            id: companyId,
                            name: companyName, // Use canonical name field only
                            company_size: '1-10', // Force default company size
                            assigned_sales_user: assignedSalesUserId,
                            assigned_at: assignedAt,
                        })
                        .select()
                        .single();

                    if (newCompanyError) {
                        throw new Error(newCompanyError.message);
                    }

                    console.log('New company created:', newCompany);

                    // Assign a sales user to the new company (server-side).
                    // This is non-blocking: a failure here must not prevent
                    // the shipper from completing profile setup.
                    try {
                        const assignResp = await fetch('/api/assign-sales-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ companyId }),
                        });
                        if (!assignResp.ok) {
                            console.warn('Sales user assignment did not complete:', assignResp.status);
                        }
                    } catch (assignErr) {
                        console.warn('Sales user assignment failed (non-blocking):', assignErr);
                    }
                }
            } else {
                companyId = uuidv4();
            }

            // Check if the profile already exists
            const { data: existingProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', session?.user?.id)
                .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
                throw new Error(profileError.message);
            }

            if (existingProfile) {
                // Update the existing profile (no redundant company_name)
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber, // Include phone number
                        company_id: companyId,
                        profile_complete: true, // Set profile_complete to true
                        team_role: 'manager', // Set team_role to manager
                    })
                    .eq('id', existingProfile.id);

                if (error) {
                    throw new Error(error.message);
                }

                console.log('Profile updated successfully');
            } else {
                // Insert a new profile (no redundant company_name)
                const { error } = await supabase
                    .from('profiles')
                    .insert({
                        id: session?.user?.id,
                        email: email, // Use the email fetched from auth.users
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber, // Include phone number
                        company_id: companyId,
                        profile_complete: true, // Set profile_complete to true
                        team_role: 'manager', // Set team_role to manager
                    });

                if (error) {
                    throw new Error(error.message);
                }

                console.log('Profile created successfully');
            }

            // Store invitations with roles and add invited users to the companies table
            for (const invite of inviteEmails) {
                const id = uuidv4(); // Generate a unique ID for the invitation
                const token = uuidv4(); // Generate a unique token for the invitation
                const { error: inviteError } = await supabase
                    .from('invitations')
                    .insert({
                        id, // Set the id field
                        email: invite.email,
                        team_role: invite.role,
                        company_id: companyId,
                        token, // Set the token field
                    });

                if (inviteError) {
                    throw new Error(inviteError.message);
                }
            }

            setSuccess(true);
            router.push('/user');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInviteEmail = () => {
        if (inviteEmail && !inviteEmails.some(invite => invite.email === inviteEmail)) {
            setInviteEmails([...inviteEmails, { email: inviteEmail, role: inviteRole }]);
            setInviteEmail('');
        }
    };

    const handleSendInvitations = async () => {
        if (session?.user?.id && companyName) {
            const { data: existingCompany, error: companyError } = await supabase
                .from('companies')
                .select('id')
                .eq('name', companyName)
                .maybeSingle();

            if (companyError) {
                setError(companyError.message);
                return;
            }

            if (!existingCompany) {
                setError('Save your profile first before sending invitations.');
                return;
            }

            await sendInvitations(inviteEmails, session.user.id, existingCompany.id);
            setInviteEmails([]);
        }
    };

    return (
        <>
            <Head>
                <title>Complete Profile</title>
                <meta name="description" content="Complete your profile" />
            </Head>
            <div className="min-h-screen bg-slate-100 py-10 px-4">
                <div className="mx-auto max-w-2xl">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-blue-700 px-8 py-8 text-white">
                            <h2 className="text-2xl font-bold tracking-tight">SHIPPER CONNECT</h2>
                            <p className="text-blue-100 mt-1">Complete your profile to start shipping</p>
                        </div>

                        <div className="p-8">
                            {error && (
                                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {success ? (
                                <div className="text-center py-10">
                                    <div className="text-green-600 text-lg font-semibold mb-2">
                                        Your profile has been completed successfully!
                                    </div>
                                    <p className="text-slate-500">Redirecting you to your dashboard…</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCompleteProfile} className="space-y-5">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="companyName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            id="companyName"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            id="phoneNumber"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Invite team */}
                                    <div className="pt-4 border-t border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-800">Invite Your Team</h3>
                                        <p className="text-sm text-slate-500 mb-3">Add teammates to your company (optional).</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                                            />
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value as 'manager' | 'member')}
                                                className="px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                                            >
                                                <option value="manager">Manager</option>
                                                <option value="member">Member</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleAddInviteEmail}
                                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {inviteEmails.length > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {inviteEmails.map((invite, index) => (
                                                    <li key={index} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                                        <span className="text-sm text-slate-700">{invite.email}</span>
                                                        <span className="text-xs uppercase font-semibold text-slate-500">{invite.role}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleSendInvitations}
                                            className="mt-4 w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
                                        >
                                            Send Invitations
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        {loading ? 'Completing Profile...' : 'Complete Profile'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProfileSetup;