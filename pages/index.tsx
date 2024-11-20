import Head from 'next/head';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <>
      <Head>
        <title>NTS Client Portal</title>
        <meta name="description" content="Welcome to NTS Client Portal" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/hc-28.png" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold mb-8">Welcome to NTS Client Portal</h1>
        <div className="flex space-x-4">
          <Link className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-blue-600 transition duration-200"  href="/client-login">
        
              Client Login
          
          </Link>
          <Link className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-zinc-900 transition duration-200" href="/nts/login">
          
              NTS Login
          
          </Link>
        </div>
      </div>
    </>
  );
};

export default LandingPage;