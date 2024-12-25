import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNtsUsers } from '@/context/NtsUsersContext';
import { Database } from '@/lib/database.types';

interface Profile {
  address: string | null;
  assigned_sales_user: string | null;
  company_id: string | null;
  company_name: string | null;
  company_size: string | null;
  email: string;
  email_notifications: boolean | null;
  first_name: string | null;
  id: string;
  inserted_at: string | null;
  last_name: string | null;
  phone_number: string | null;
  profile_complete: boolean | null;
  profile_picture: string | null;
  team_role: string | null;
}

interface Company {
  assigned_at: string | null;
  assigned_sales_user: string | null;
  company_name: string | null;
  company_size: string | null;
  id: string;
  name: string;
}

interface ShippingQuote {
  id: number;
  company_id: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  due_date: string | null;
  status: string | null;
}

const Crm: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const { userProfile } = useNtsUsers();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('company_name');

  useEffect(() => {
    const fetchAssignedCustomers = async () => {
      if (userProfile?.id) {
        // Fetch company IDs assigned to the current nts_user
        const { data: companyIdsData, error: companyIdsError } = await supabase
          .from('company_sales_users')
          .select('company_id')
          .eq('sales_user_id', userProfile.id);

        if (companyIdsError) {
          console.error('Error fetching company IDs:', companyIdsError.message);
          return;
        }

        const companyIds = companyIdsData.map((item: any) => item.company_id);

        if (companyIds.length === 0) {
          setCompanies([]);
          setProfiles([]);
          setShippingQuotes([]);
          return;
        }

        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);

        if (companiesError) {
          console.error('Error fetching assigned companies:', companiesError.message);
        } else if (companiesData) {
          console.log('Fetched companies:', companiesData);
          setCompanies(companiesData);
        }

        // Fetch profiles related to the companies
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('company_id', companyIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message);
        } else if (profilesData) {
          console.log('Fetched profiles:', profilesData);
          setProfiles(profilesData);
        }

        // Fetch shipping quotes related to the companies
        const { data: shippingQuotesData, error: shippingQuotesError } = await supabase
          .from('shippingquotes')
          .select('*')
          .in('company_id', companyIds);

        if (shippingQuotesError) {
          console.error('Error fetching shipping quotes:', shippingQuotesError.message);
        } else if (shippingQuotesData) {
          console.log('Fetched shipping quotes:', shippingQuotesData);
          setShippingQuotes(shippingQuotesData);
        }
      }
    };

    fetchAssignedCustomers();
  }, [userProfile, supabase]);

  const getProfilesForCompany = (companyId: string) => {
    return profiles.filter(profile => profile.company_id === companyId);
  };

  const getShippingQuotesForCompany = (companyId: string) => {
    return shippingQuotes.filter(quote => quote.company_id === companyId);
  };

  const filteredCompanies = companies.filter(company => {
    if (searchColumn === 'company_name') {
      return company.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchColumn === 'first_name' || searchColumn === 'last_name' || searchColumn === 'email') {
      return getProfilesForCompany(company.id).some(profile =>
        profile[searchColumn]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return false;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Assigned Customers</h1>
      <div className="flex justify-start gap-4 my-4">
        <div className="flex items-center">
          <label className="mr-2">Search by:</label>
          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm"
          >
            <option value="company_name">Company Name</option>
            <option value="first_name">First Name</option>
            <option value="last_name">Last Name</option>
            <option value="email">Email</option>
          </select>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 pl-2 rounded-md shadow-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className='bg-ntsBlue text-white'>
            <tr className='divide-x-2'>
              <th className="text-start px-4 py-2 border-b">Company Name</th>
              <th className="text-start px-4 py-2 border-b">Company Size</th>
              <th className="text-start px-4 py-2 border-b">Company Users</th>
              <th className="text-start px-4 py-2 border-b">Shipping Quotes</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map(company => (
              <tr key={company.id} className="hover:bg-gray-100 divide-x-2">
                <td className="px-4 py-2 border-b">
                  <Link className="text-blue-500 hover:underline" href={`/companies/${company.id}`} legacyBehavior>
                    {company.company_name}
                  </Link>
                </td>
                <td className="px-4 py-2 border-b">{company.company_size}</td>
                <td className="px-4 py-2 border-b">
                  <ul className="list-disc list-inside">
                    {getProfilesForCompany(company.id).map(profile => (
                      <li key={profile.id}>
                        {profile.first_name} {profile.last_name} - {profile.email}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2 border-b">
                  <ul className="list-disc list-inside">
                    {getShippingQuotesForCompany(company.id).map(quote => (
                      <li key={quote.id}>
                        {quote.origin_city}, {quote.origin_state} to {quote.destination_city}, {quote.destination_state} - Due: {quote.due_date} - Status: {quote.status}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Crm;