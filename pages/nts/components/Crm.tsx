import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNtsUsers } from '@/context/NtsUsersContext';

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
  const supabase = useSupabaseClient();
  const { userProfile } = useNtsUsers();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchAssignedCustomers = async () => {
      if (userProfile?.id) {
        const { data, error } = await supabase
          .from('company_sales_users')
          .select('company_id, profiles(*)')
          .eq('sales_user_id', userProfile.id);

        if (error) {
          console.error('Error fetching assigned customers:', error.message);
        } else if (data) {
          const assignedCompanies = data.map((item: any) => item.profiles.company_id);
          setCompanies(assignedCompanies);
          setProfiles(data.map((item: any) => item.profiles));
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
              <td>{company.name}</td>
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