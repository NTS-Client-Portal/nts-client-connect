import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function SignUpPage() {
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [industry, setIndustry] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userType, setUserType] = useState('company');
    const [currentStep, setCurrentStep] = useState(1);

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
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `https://www.shipper-connect.com/confirm-signup`, // Redirect to the confirmation page
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber,
                        company_name: userType === 'individual' ? `${firstName} ${lastName}` : companyName,
                    },
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            // Insert profile into the profiles table
            const user = data.user;
            if (user) {
                const companyId = user.id; // Use user ID as company ID for simplicity

                // Insert into companies table
                await supabase
                    .from('companies')
                    .insert({
                        id: companyId,
                        name: userType === 'individual' ? `${firstName} ${lastName}` : companyName,
                        industry: industry,
                    });

                // Assign the user to a broker using the Netlify function
                await fetch('/.netlify/functions/assign-sales-user', {
                    method: 'POST',
                    body: JSON.stringify({ companyId }),
                });

                await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber,
                        company_name: userType === 'individual' ? `${firstName} ${lastName}` : companyName,
                        industry: industry,
                    });
            }

            setSuccess(true);
            setCurrentStep(2); // Move to the next step
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-200">
            <div className="md:grid min-w-full min-h-screen md:grid-cols-2 ">
                <div className="hidden md:grid bg-gray-950 h-1/3 w-full md:h-full col-span-1">
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
                        <Link href="/" className="body-btn">
                            Login
                        </Link>
                    </div>
                    <div className=" w-full text-zinc-900 h-full sm:h-auto sm:w-full max-w-md p-5 bg-white shadow flex flex-col justify-center items-center text-base">
                        <h2 className="mt-12 md:mt-0 text-2xl font-bold text-center">SHIPPER CONNECT</h2>
                        <div className="xs:w-2/5 md:w-full h-full sm:h-auto p-5 bg-white shadow flex flex-col text-base">
                            <span className="font-sans text-4xl text-center pb-2 mb-1 border-b mx-4 align-center">
                                Sign Up
                            </span>
                            {error && <div className="text-red-500 text-center mb-4">{error}</div>}
                            {success && currentStep === 1 ? (
                                <div className="text-green-500 text-center mb-4 border border-zinc-900 p-4 rounded">
                                    Your sign up was successful! Please check your email to confirm your account. Make sure to check your spam or junk folder if you don&apos;t see it within a few minutes!
                                </div>
                            ) : (
                                <>
                                    {currentStep === 1 && (
                                        <form className="mt-4" onSubmit={handleSignUp}>
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Are you signing up as a company or an individual?</label>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setUserType('company')}
                                                        className={`w-full p-2 border rounded ${userType === 'company' ? 'bg-ntsLightBlue text-white' : 'bg-gray-200'}`}
                                                        disabled={loading}
                                                    >
                                                        Company
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUserType('individual')}
                                                        className={`w-full p-2 border rounded ${userType === 'individual' ? 'bg-ntsLightBlue text-white' : 'bg-gray-200'}`}
                                                        disabled={loading}
                                                    >
                                                        Individual
                                                    </button>
                                                </div>
                                            </div>
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
                                            {userType === 'company' && (
                                                <>
                                                    <label htmlFor="companyName" className="mt-4">Company Name</label>
                                                    <input
                                                        type="text"
                                                        id="companyName"
                                                        value={companyName}
                                                        onChange={(e) => setCompanyName(e.target.value)}
                                                        className="w-full p-1 mb-2 border rounded"
                                                        disabled={loading}
                                                    />
                                                </>
                                            )}
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
                                            <label htmlFor="industry" className="mt-4">Industry</label>
                                            <select
                                                id="industry"
                                                value={industry}
                                                onChange={(e) => setIndustry(e.target.value)}
                                                required
                                                className="w-full p-2 mb-6 border rounded"
                                                disabled={loading}
                                            >
                                                <option value="">Select Industry</option>
                                                <option value="Construction/Contractor">Construction/Contractor</option>
                                                <option value="Auto/Truck Dealer">Auto/Truck Dealer</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Auction"> Auction</option>
                                                <option value="Wholesaler">Wholesaler</option>
                                                <option value="Mining">Mining</option>
                                                <option value="Manufacturer">Manufacturer</option>
                                                <option value="Equipment Rental">Equipment Rental</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <button
                                                type="submit"
                                                className="w-full body-btn mt-12"
                                                disabled={loading}
                                            >
                                                {loading ? 'Signing Up...' : 'Sign Up'}
                                            </button>
                                        </form>
                                    )}
                                </>
                            )}
                            <div className='flex flex-col justify-evenly max-h-max items-center w-full my-4'>
                                <div className='border-t border-zinc-900/40 pt-1 mb-2 w-full text-center'><h3>Already have an account?</h3></div>
                                <Link href="/" className="text-center underline underline-offset-4 text-lg font-semibold text-zinc-700 hover:underline px-4 py-2 hover:text-zinc-900/70">
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}