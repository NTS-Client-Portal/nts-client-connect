import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/supabase/provider';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ArrowRight, Users, Shield, Clock, Star, Award } from 'lucide-react';

export default function HomePage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (session) {
      router.push('/user');
    }
  }, [session?.user?.id, router]);

  if (session) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>NTS Logistics - Professional Freight & Transportation Services</title>
        <meta name="description" content="Nationwide freight shipping solutions - auto transport, heavy equipment, machinery, and general freight. 15+ years experience with 150K+ trucks nationwide." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/hc-28.png" />
      </Head>
      
      <div className="min-h-screen bg-slate-900 relative overflow-hidden">
        {/* Hero Background with D8T Image */}
        <div className="absolute inset-0">
          <Image
            src="/d8t-winch-dozer.jpg"
            alt="D8T Caterpillar Dozer being transported by NTS Logistics"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-4 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">NTS Logistics</h1>
                <p className="text-sm text-blue-200 font-medium">Nationwide Freight Solutions</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Client Portal
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Hero Content */}
              <div className="text-center lg:text-left space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2">
                    <Award className="h-5 w-5 text-blue-400" />
                    <span className="text-blue-100 font-medium">Trusted by Industry Leaders</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                    Professional
                    <span className="block text-blue-400">Freight & Logistics</span>
                    <span className="block">Solutions</span>
                  </h1>
                  
                  <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed">
                    From auto transport to heavy equipment, agricultural machinery to general freight - we handle it all. 
                    <span className="block mt-2 text-blue-200 font-semibold">Honest, dependable, efficient, and productive transportation nationwide.</span>
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 py-8">
                  <div className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-blue-400">15+</div>
                    <div className="text-sm text-slate-300">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-blue-400">150K+</div>
                    <div className="text-sm text-slate-300">Trucks Nationwide</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-blue-400">30K+</div>
                    <div className="text-sm text-slate-300">Contracted Carriers</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-10">
                  <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-linear-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-xl mb-6">
                      <Truck className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Client Portal</h2>
                    <p className="text-slate-300 text-lg">Manage your shipments, track deliveries, and request quotes</p>
                  </div>

                  <div className="space-y-6">
                    {/* Sign In Button */}
                    <Link 
                      href="/login" 
                      className="w-full flex items-center justify-center space-x-3 bg-linear-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg group shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <span>Access Portal</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>

                    {/* Divider */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 h-px bg-white/20"></div>
                      <span className="text-slate-300 text-sm font-medium">New Client?</span>
                      <div className="flex-1 h-px bg-white/20"></div>
                    </div>

                    {/* Sign Up Button */}
                    <Link 
                      href="/signup" 
                      className="w-full flex items-center justify-center space-x-3 bg-white/10 text-white py-4 px-8 rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 font-semibold text-lg group backdrop-blur-sm transform hover:scale-[1.02]"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>

                  {/* Additional Links */}
                  <div className="mt-8 pt-6 border-t border-white/20 text-center space-y-3">
                    <Link href="/forgot-password" className="block text-white hover:text-white text-sm transition-colors duration-200 hover:underline">
                      Forgot your password?
                    </Link>
                    <div className="text-xs text-slate-400">
                      <p className="mb-1">Questions about freight shipping?</p>
                      <p>
                        Call us at{' '}
                        <a href="tel:+18773830580" className="text-blue-400 hover:text-blue-300 font-semibold">
                          (877) 383-0580
                        </a>
                        {' '}or email{' '}
                        <a href="mailto:quotes@ntslogistics.com" className="text-blue-400 hover:text-blue-300 font-semibold">
                          quotes@ntslogistics.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                {/* Key Benefits */}
                <div className="space-y-4 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Star className="h-6 w-6 text-yellow-400 mr-2" />
                    Why Choose NTS Logistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-400 shrink-0" />
                      <span className="text-slate-200">Fully insured & licensed nationwide</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-400 shrink-0" />
                      <span className="text-slate-200">Real-time tracking & updates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-400 shrink-0" />
                      <span className="text-slate-200">Dedicated logistics specialists</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Truck className="h-5 w-5 text-orange-400 shrink-0" />
                      <span className="text-slate-200">All freight types - cars to heavy equipment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Access Portal */}
              <div className="lg:ml-8">
                            {/* Client Testimonial */}
                <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="shrink-0">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-yellow-100 text-sm font-medium italic">
                        "NTS has handled everything from our car shipments to heavy machinery transports. Always professional, reliable service. 
                        They're our go-to logistics partner for any shipping need."
                      </p>
                      <p className="text-yellow-200/80 text-xs mt-2 font-semibold">— Long-term Client</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom CTA Strip */}
        <div className="relative z-10 bg-blue-500/90 backdrop-blur-sm border-t border-blue-400/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white">Ready to ship your freight?</h3>
                <p className="text-blue-100">Get a quote in minutes for cars, equipment, or any freight nationwide</p>
              </div>
              <div className="flex space-x-4">
                <Link 
                  href="/signup" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Request Quote
                </Link>
                <a 
                  href="tel:+18773830580" 
                  className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                >
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}