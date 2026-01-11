import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useSupabaseClient } from '@/lib/supabase/provider';
import { useRouter } from 'next/router';
import { 
  ArrowRight, 
  User, 
  Users, 
  Mail, 
  Lock, 
  Phone, 
  Building, 
  Check, 
  Star, 
  Truck, 
  Package, 
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const SignUpPage = () => {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    companySize: '',
    industry: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.password && formData.confirmPassword && 
               formData.password === formData.confirmPassword);
      case 2:
        return !!(formData.firstName && formData.lastName && formData.phoneNumber);
      case 3:
        return !!(formData.companyName && formData.companySize && formData.industry);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setLoading(true);
    setError(null);

    try {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            phone_number: formData.phoneNumber,
            company_size: formData.companySize,
            industry: formData.industry
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/profile-setup`
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Automatically sign in the user after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        // If auto-login fails, still show success but redirect to login
        setSuccess('Account created! Please sign in to continue.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        // Auto-login successful - redirect to dashboard
        setSuccess('Welcome! Taking you to your dashboard...');
        setTimeout(() => router.push('/user/freight-rfq'), 1500);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Setup</h2>
              <p className="text-slate-600">Create your login information</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                  placeholder="your.email@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/3 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/3 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Personal Details</h2>
              <p className="text-slate-600">Your contact information</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                    placeholder="Your first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                    placeholder="Your last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Company Details</h2>
              <p className="text-slate-600">Information about your business</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-500 bg-white"
                  placeholder="Your company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Company Size *
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
                  required
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501+">501+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
                  required
                >
                  <option value="">Select your industry</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="construction">Construction</option>
                  <option value="automotive">Automotive</option>
                  <option value="food-beverage">Food & Beverage</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - NTS Logistics</title>
        <meta name="description" content="Join NTS Logistics - Professional freight and logistics services" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/hc-28.png" />
      </Head>
      
      <div className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen">
          {/* Left Side - Form */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto h-20 w-20 bg-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <Truck className="h-12 w-12 text-white" />
                </div>
                <h1 className="mt-4 text-3xl font-bold text-slate-800">
                  Sign Up for NTS Logistics
                </h1>
                <p className="mt-2 text-slate-600 font-medium">
                  Nationwide freight and logistics solutions
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 ${
                      currentStep >= step
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-500 border-slate-300'
                    }`}>
                      {currentStep > step ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step
                      )}
                    </div>
                    {step < 3 && (
                      <div className={`w-6 h-1 mx-1 ${
                        currentStep > step ? 'bg-blue-700' : 'bg-slate-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
                {/* Error/Success Messages */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-green-700 font-medium">{success}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {renderStep()}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-colors duration-200 border border-slate-300"
                      >
                        Back
                      </button>
                    )}
                    
                    <div className="ml-auto">
                      {currentStep < 3 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          disabled={!validateStep(currentStep)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 ${
                            validateStep(currentStep)
                              ? 'bg-blue-700 text-white hover:bg-blue-800 border border-blue-700'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          }`}
                        >
                          <span>Continue</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loading || !validateStep(3)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 ${
                            validateStep(3) && !loading
                              ? 'bg-green-700 text-white hover:bg-green-800 border border-green-700'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          }`}
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Create Account</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                {/* Login Link */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="hidden lg:flex lg:flex-1 bg-blue-700">
            <div className="flex flex-col justify-center px-8 text-white">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  Comprehensive Freight Solutions
                </h2>
                <p className="text-lg text-blue-100">
                  From auto transport to heavy equipment - trusted by businesses nationwide
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Reliable Delivery</h3>
                    <p className="text-blue-100">Your freight arrives safely and on schedule</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Fully Insured</h3>
                    <p className="text-blue-100">Complete protection for all types of freight and cargo</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">All Freight Types</h3>
                    <p className="text-blue-100">Cars, equipment, machinery - we handle everything</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">24/7 Support</h3>
                    <p className="text-blue-100">Real people you can call when you need help or updates</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-blue-600">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">15+ Years</div>
                    <div className="text-sm text-blue-200">In Business</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">150K+</div>
                    <div className="text-sm text-blue-200">Trucks Available</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">30K+</div>
                    <div className="text-sm text-blue-200">Carriers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">$0</div>
                    <div className="text-sm text-blue-200">Setup Fees</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;