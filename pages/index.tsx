import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import Link from 'next/link';
import { Truck, ArrowRight, Users, Shield, Clock } from 'lucide-react';

export default function HomePage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (session && session.user.email_confirmed_at) {
      router.push('/user/logistics-management');
    }
  }, [session, router]);

  if (session && session.user.email_confirmed_at) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>NTS Logistics - Client Portal</title>
        <meta name="description" content="Professional freight and logistics services portal" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/hc-28.png" />
      </Head>
      
      <div className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Side - Branding & Info */}
              <div className="text-center lg:text-left space-y-6">
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="p-3 bg-blue-700 rounded-lg shadow-md">
                    <Truck className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">NTS Logistics</h1>
                    <p className="text-lg text-slate-600 font-medium">Client Portal</p>
                  </div>
                </div>
                
                <p className="text-xl text-slate-700 leading-relaxed">
                  Professional freight and transportation services for contractors, builders, and businesses across America.
                </p>

                {/* Key Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-blue-700 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">On-time delivery guaranteed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-blue-700 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">Fully insured and licensed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-700 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">24/7 customer support</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-700">
                  <p className="text-slate-700 font-medium">
                    <span className="text-blue-700 font-bold">15+ years</span> serving contractors and businesses with reliable freight solutions
                  </p>
                </div>
              </div>

              {/* Right Side - Access Options */}
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto h-16 w-16 bg-blue-700 rounded-lg flex items-center justify-center shadow-md mb-4">
                    <Truck className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Your Account</h2>
                  <p className="text-slate-600">Sign in to manage your shipments and requests</p>
                </div>

                <div className="space-y-4">
                  {/* Sign In Button */}
                  <Link href="/login" className="w-full flex items-center justify-center space-x-3 bg-blue-700 text-white py-4 px-6 rounded-lg hover:bg-blue-800 transition-colors duration-200 font-semibold text-lg group">
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>

                  {/* Divider */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-px bg-slate-300"></div>
                    <span className="text-slate-500 text-sm font-medium">New Customer?</span>
                    <div className="flex-1 h-px bg-slate-300"></div>
                  </div>

                  {/* Sign Up Button */}
                  <Link href="/signup" className="w-full flex items-center justify-center space-x-3 bg-white text-blue-700 py-4 px-6 rounded-lg border-2 border-blue-700 hover:bg-blue-50 transition-colors duration-200 font-semibold text-lg group">
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>

                {/* Additional Links */}
                <div className="mt-8 pt-6 border-t border-slate-200 text-center space-y-3">
                  <Link href="/forgot-password" className="block text-slate-600 hover:text-slate-800 text-sm transition-colors duration-200">
                    Forgot your password?
                  </Link>
                  <p className="text-xs text-slate-500">
                    Questions? Contact us at{' '}
                    <a href="mailto:support@ntslogistics.com" className="text-blue-700 hover:text-blue-800">
                      support@ntslogistics.com
                    </a>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}