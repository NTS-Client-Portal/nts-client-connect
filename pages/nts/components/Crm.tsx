import React, { useEffect, useState } from 'react';
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

const Crm: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const { userProfile } = useNtsUsers();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

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
          return;
        }

        // Fetch companies and their related profiles
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*, profiles(*)')
          .in('id', companyIds);

        if (companiesError) {
          console.error('Error fetching assigned companies:', companiesError.message);
        } else if (companiesData) {
          setCompanies(companiesData);
          const allProfiles = companiesData.flatMap((company: any) => company.profiles);
          setProfiles(allProfiles);
        }
      }
    };

    fetchAssignedCustomers();
  }, [userProfile, supabase]);

  const getProfilesForCompany = (companyId: string) => {
    return profiles.filter(profile => profile.company_id === companyId);
  };

  return (
    <div>
      <h1>Assigned Customers</h1>
      <table>
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Company Size</th>
            <th>Profiles</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(company => (
            <tr key={company.id}>
              <td>{company.company_name}</td>
              <td>{company.company_size}</td>
              <td>
                <ul>
                  {getProfilesForCompany(company.id).map(profile => (
                    <li key={profile.id}>
                      {profile.first_name} {profile.last_name} - {profile.email}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Crm;