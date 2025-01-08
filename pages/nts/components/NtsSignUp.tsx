import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { sendOtpEmail } from '@/lib/sendOtpEmail';
import { Eye } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userType, setUserType] = useState('company');
    const [currentStep, setCurrentStep] = useState(1);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

    const validatePassword = (password: string): boolean => {
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        return hasLowercase && hasUppercase && hasDigit;
    };

    const generateOtp = () => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        return otp;
    };

    const handleSendOtp = async (e: React.FormEvent) => {
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
            const otp = generateOtp();
            await sendOtpEmail(email, otp); // Use the sendOtpEmail function

            setCurrentStep(2); // Move to the OTP verification step
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (otp !== generatedOtp) {
            setError('Invalid OTP');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw new Error(error.message);
            }

            // Complete profile setup
            await handleCompleteProfile();

            setSuccess(true);
            setCurrentStep(3); // Move to the next step
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                throw new Error(sessionError.message);
            }

            try {
                let profilePictureUrl = null;

                if (profilePicture) {
                    const { data, error: uploadError } = await supabase
                        .storage
                        .from('profile-pictures')
                        .upload(`public/${profilePicture.name}`, profilePicture);

                    if (uploadError) {
                        throw new Error(uploadError.message);
                    }

                    profilePictureUrl = `${supabaseUrl}/storage/v1/object/public/profile-pictures/${data.path}`;
                }

                const { error } = await supabase
                    .from('nts_users')
                    .insert({
                        id: session?.user.id,
                        email: email,
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber,
                        company_id: process.env.NEXT_PUBLIC_NTS_COMPANY_ID,
                        role: 'sales',
                        profile_picture: profilePictureUrl,
                    });

                if (error) {
                    throw new Error(error.message);
                }

                setSuccess(true);
            } catch (error) {
                setError(error.message);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                {currentStep === 1 && (
                    <form onSubmit={handleSendOtp}>
                        <h2 className="text-2xl font-semibold mb-6">Sign Up</h2>
                        {error && <div className="text-red-500 mb-4">{error}</div>}
                        <div className="mb-4">
                            <label className="block text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Phone Number</label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Industry</label>
                            <input
                                type="text"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Profile Picture</label>
                            <input
                                type="file"
                                onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {profilePicture && (
                                <img
                                    src={URL.createObjectURL(profilePicture)}
                                    alt="Profile Preview"
                                    className="mt-2 w-32 h-32 object-cover rounded-full"
                                />
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Sign Up'}
                        </button>
                    </form>
                )}
                {currentStep === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <h2 className="text-2xl font-semibold mb-6">Verify OTP</h2>
                        {error && <div className="text-red-500 mb-4">{error}</div>}
                        <div className="mb-4">
                            <label className="block text-gray-700">Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Verifying OTP...' : 'Verify OTP'}
                        </button>
                    </form>
                )}
                {currentStep === 3 && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Sign Up Successful</h2>
                        <p className="mb-4">Your account has been created successfully.</p>
                        <Link href="nts/login">
                            <a className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-center block">
                                Go to Login
                            </a>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}