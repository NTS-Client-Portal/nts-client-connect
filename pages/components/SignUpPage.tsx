import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { sendInvitations } from '@/lib/invitationService'; // Adjust the import path as needed
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import { assignSalesUser } from '@/lib/assignSalesUser'; // Import the assignSalesUser function

export default function SignUpPage() {
    const supabase = useSupabaseClient();
    const session = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [inviteEmails, setInviteEmails] = useState<{ email: string, role: 'manager' | 'member' }[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'manager' | 'member'>('member');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validatePassword = (password: string): boolean => {
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        return hasLowercase && hasUppercase && hasDigit;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must contain at least one lowercase letter, one uppercase letter, and one digit');
            setLoading(false);
            return;
        }

        try {
            // Check if the user exists in the nts_users table
            const { data: internalUser, error: internalUserError } = await supabase
                .from('nts_users')
                .select('id')
                .eq('email', email)
                .single();

            if (internalUserError && internalUserError.code !== 'PGRST116') {
                throw new Error(internalUserError.message);
            }

            if (internalUser) {
                setError('Internal users are not allowed to sign up to the client version of the application.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw new Error(error.message);
            }

            // Complete profile setup
            await handleCompleteProfile();

            setSuccess(true);
            router.push('/user'); // Redirect to user page
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async () => {
        try {
            // Ensure the company exists or create a new one
            let companyId: string;
            if (companyName) {
                const { data: existingCompany, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('name', companyName)
                    .single();

                if (companyError && companyError.code !== 'PGRST116') {
                    throw new Error(companyError.message);
                }

                if (existingCompany) {
                    companyId = existingCompany.id;

                    // Update the existing company with missing fields
                    const updates = {} as Partial<{
                        assigned_sales_user: string;
                        assigned_at: string;
                        company_name: string;
                        company_size: string;
                    }>;
                    if (!existingCompany.assigned_sales_user) updates.assigned_sales_user = '2b5928cc-4f66-4be4-8d76-4eb91c55db00';
                    if (!existingCompany.assigned_at) updates.assigned_at = new Date().toISOString();
                    if (!existingCompany.company_name) updates.company_name = companyName;
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
                            name: companyName,
                            company_name: companyName, // Ensure company_name is set
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

                    // Assign a sales user to the new company
                    await assignSalesUser(companyId);
                }
            } else {
                companyId = uuidv4();
            }

            // Check if the profile already exists
            const { data: existingProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                throw new Error(profileError.message);
            }

            if (existingProfile) {
                // Update the existing profile
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        first_name: firstName,
                        last_name: lastName,
                        company_name: companyName || `${firstName} ${lastName}`,
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
                // Insert a new profile with a generated UUID
                const profileId = uuidv4(); // Generate a unique ID for the profile
                const { error } = await supabase
                    .from('profiles')
                    .insert({
                        id: profileId, // Use the generated UUID
                        email: email, // Use the email fetched from auth.users
                        first_name: firstName,
                        last_name: lastName,
                        company_name: companyName || `${firstName} ${lastName}`,
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
        } catch (error) {
            setError(error.message);
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
                .single();

            if (companyError) {
                setError(companyError.message);
                return;
            }

            const companyId = existingCompany.id;

            await sendInvitations(inviteEmails, session.user.id, companyId);
            setInviteEmails([]);
        }
    };

    return (
        <>
            <Head>
                <title>NTS-SHIPPER-CONNECT - Sign Up</title>
                <meta name="description" content="Sign up for an account" />
            </Head>
            <div className="w-full h-full bg-200">
                <div className="md:grid min-w-full min-h-screen md:grid-cols-2 ">
                    <div style={{ backgroundImage: "url('/images/d8t-dozer-dark.jpg')", backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }} className="hidden md:grid h-1/3 w-full md:h-full col-span-1">
                        <div className='absolute top-5 left-5'>
                            <div className='flex mt-5 lg:mt-2 2xl:mt-0 mb-3 items-center justify-center font-bold flex-nowrap'>
                                <Image
                                    src="/nts-logo.png"
                                    alt="NTS Logo"
                                    width={150}
                                    height={50}
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        <div className='hidden h-full pb-12 w-full md:flex items-end justify-center'>
                            <h1 className='text-stone-100 font-medium text-xl italic'>Your trusted partner in Logistics.</h1>
                        </div>
                    </div>

                    <div className="sm:row-span-1 md:col-span-1 w-full h-full flex flex-col justify-center items-center bg-zinc-100">
                        <div className='hidden md:block md:absolute top-5 right-5'>
                            <Link href="/" legacyBehavior>
                                <a className="body-btn">Login</a>
                            </Link>
                        </div>
                        <div className=" w-full text-zinc-900 h-full sm:h-auto sm:w-full max-w-md p-5 bg-white shadow flex flex-col justify-center items-center text-base">
                            <h2 className="mt-12 md:mt-0 text-2xl font-bold text-center">SHIPPER CONNECT</h2>
                            <div className="xs:w-2/5 md:w-full h-full sm:h-auto p-5 bg-white shadow flex flex-col text-base">
                                <span className="font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center">
                                    Sign Up
                                </span>
                                {error && <div className="text-red-500 text-center mb-4">{error}</div>}
                                {success ? (
                                    <div className="text-green-500 text-center mb-4 border border-zinc-900 p-4 rounded">
                                        Your sign up was successful! Please check your email to confirm your account. Make sure to check your spam or junk folder if you don&apos;t see it within a few minutes!
                                    </div>
                                ) : (
                                    <form className="mt-4" onSubmit={handleSignUp}>
                                    <div className='flex gap-2 mb-2'>
                                        <label htmlFor="firstName" className="mt-4">First Name
                                        <input
                                            type="text"
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="w-full p-1 border rounded"
                                            disabled={loading}
                                        /></label>
                                        <label htmlFor="lastName" className="mt-4">Last Name
                                        <input
                                            type="text"
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full p-1 mb-2 border rounded"
                                            disabled={loading}
                                        /></label>
                                    </div>
                                    <label htmlFor="companyName" className="mt-4">Company Name</label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full p-1 mb-2 border rounded"
                                        disabled={loading}
                                    />
                                    <label htmlFor="phoneNumber" className="mt-4">Phone Number</label>
                                    <input
                                        type="text"
                                        id="phoneNumber"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full p-1 mb-2 border rounded"
                                        disabled={loading}
                                    />
                                    <label htmlFor="email" className="mt-4">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full p-1 mb-2 border rounded"
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                    <label htmlFor="password" className="mt-4">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full p-1 mb-2 border rounded"
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <label htmlFor="confirmPassword" className="mt-4">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full p-2 mb-6 border rounded"
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />

                                    {/* <div className="mt-8">
                                        <h3 className="text-xl font-bold text-center">Invite Your Team!</h3>
                                        <div className="flex mt-4">
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            />
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value as 'manager' | 'member')}
                                                className="ml-2 p-2 border rounded"
                                            >
                                                <option value="manager">Manager</option>
                                                <option value="member">Member</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleAddInviteEmail}
                                                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <ul className="mt-4">
                                            {inviteEmails.map((invite, index) => (
                                                <li key={index} className="flex justify-between items-center">
                                                    <span>{invite.email} ({invite.role})</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={handleSendInvitations}
                                            className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded"
                                        >
                                            Send Invitations
                                        </button>
                                    </div> */}
                                    <button
                                        type="submit"
                                        className="w-full body-btn mt-12"
                                        disabled={loading}
                                    >
                                        {loading ? 'Signing Up...' : 'Sign Up'}
                                    </button>
                                </form>
                                )}
                                <div className='flex flex-col justify-evenly max-h-max items-center w-full my-4'>
                                    <div className='border-t border-zinc-900/40 pt-1 mb-2 w-full text-center'><h3>Already have an account?</h3></div>
                                    <Link href="/" legacyBehavior>
                                        <a className="text-center underline underline-offset-4 text-lg font-semibold text-zinc-700 hover:underline px-4 py-2 hover:text-zinc-900/70">Login</a>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}