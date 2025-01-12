import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import Link from 'next/link';
import CustomSignInForm from '@/components/CustomSignInForm';
import { MoveHorizontal } from 'lucide-react';
import Layout from './components/Layout';
import Image from 'next/image';

interface UserProfile {
  id: string;
  email: string;
  team_role: string;
  inserted_at: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  profile_picture?: string | null;
  address?: string | null;
  phone_number?: string | null;
  company_id?: string | null;
  company_size?: string | null;
  email_notifications?: boolean | null;
  industry?: string | null;
}

const LoginPage = () => {
  const supabase = useSupabaseClient();


    return (
      <>
        <Head>
          <title>Shipper Connect</title>
          <meta name="description" content="Welcome to SSTA Reminders & Tasks" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/hc-28.png" />
        </Head>
        <div className="w-full h-screen bg-200">
          <div className="min-w-full min-h-screen grid grid-cols-1 md:grid-cols-2 ">

            <div className="hidden md:block bg-gray-950 h-full w-full md:h-full col-span-1">
              <div className='absolute top-5 left-5'>
                <span className='flex mt-5 lg:mt-2 2xl:mt-0 items-center justify-center font-bold  flex-nowrap'> <h2 className='text-lg md:mt-0  self-center font-extrabold tracking-tighter text-white flex gap-0.5'>SHIPPER<MoveHorizontal className='size-6 text-orange-500' />CONNECT</h2></span>
                <span className='text-xs md:text-base font-bold text-center text-orange-500'>A Division of NTS Logistics</span>
              </div>
              <div className='hidden h-5/6 w-full md:flex items-center justify-center'>
                <h1 className='text-white font-medium text-2xl italic'>Your trusted partner in logistics.</h1>
              </div>
            </div>

            <div className='absolute top-5 right-5'>
              <Link href="/signup" legacyBehavior>
                <a className="body-btn">Sign Up</a>
              </Link>
            </div>

            <div className='w-full h-auto flex flex-col justify-center items-center col-span-1'>

              <div className=" w-full h-full max-h-max text-zinc-900 sm:h-full sm:w-full max-w-md p-5 bg-white shadow flex flex-col justify-center items-center text-base">
                <span className="font-sans text-4xl font-medium text-center pb-2 mb-2 my-6 border-b mx-4 align-center">
                  SHIPPER CONNECT
                </span>
                <span className=" font-sans text-2xl text-center pb-2 mb-1 border-b mx-4 align-center">
                  Sign In
                </span>
                <div className="mt-4">
                  <CustomSignInForm />
                </div>
                <div className="mt-4 text-center">
                  <p>Don&apos;t have an account?</p>
                  <Link href="/signup" legacyBehavior>
                    <a className="text-zinc-900 font-semibold hover:underline">Sign Up</a>
                  </Link>
                </div>
                <div className="mt-4 text-center">
                  <p>Forgot your password?</p>
                  <Link href="/recover-password?userType=profiles" legacyBehavior>
                    <a className="text-zinc-900 font-semibold hover:underline">Reset Password</a>
                  </Link>
                </div>
                <div className='md:hidden h-5/6 w-full flex items-end justify-center'>
                  <h1 className='text-zinc-900 font-medium w-full text-lg text-center italic'>Your trusted partner in Logistics.</h1>
                </div>
              </div>

            </div>

          </div>
        </div>
      </>
    );
  }

export default LoginPage;