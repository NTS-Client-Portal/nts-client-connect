import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/initSupabase';
import { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type CompanySalesUser = Database['public']['Tables']['company_sales_users']['Row'];
type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const ShipperUserManagement: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [ntsUsers, setNtsUsers] = useState<NtsUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedSalesUserId, setSelectedSalesUserId] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            setError(error.message);
        } else {
            setProfiles(data as Profile[]);
        }
        setLoading(false);
    }, []);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('company_sales_users')
            .select('company_id')
            .in('company_id', (await supabase.from('companies').select('id')).data.map((company: Company) => company.id));
        if (error) {
            setError(error.message);
        } else {
            const companyIds = data.map((csu: CompanySalesUser) => csu.company_id);
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('*')
                .in('id', companyIds);
            if (companiesError) {
                setError(companiesError.message);
            } else {
                setCompanies(companiesData as Company[]);
            }
        }
        setLoading(false);
    }, []);

    const fetchNtsUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('nts_users').select('*');
        if (error) {
            setError(error.message);
        } else {
            setNtsUsers(data as NtsUser[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProfiles();
        fetchCompanies();
        fetchNtsUsers();
    }, [fetchProfiles, fetchCompanies, fetchNtsUsers]);

    const getProfilesForCompany = (companyId: string) => {
        return profiles.filter(profile => profile.company_id === companyId);
    };

    const handleAssignSalesUser = async (companyId: string) => {
        if (!selectedSalesUserId) {
            setError('Please select a sales user');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { data: existingAssignment, error: fetchError } = await supabase
                .from('company_sales_users')
                .select('id')
                .eq('company_id', companyId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw new Error(fetchError.message);
            }

            if (existingAssignment) {
                const { error: updateError } = await supabase
                    .from('company_sales_users')
                    .update({ sales_user_id: selectedSalesUserId })
                    .eq('id', existingAssignment.id);

                if (updateError) {
                    throw new Error(updateError.message);
                }
            } else {
                const { error: insertError } = await supabase
                    .from('company_sales_users')
                    .insert({
                        company_id: companyId,
                        sales_user_id: selectedSalesUserId,
                    });

                if (insertError) {
                    throw new Error(insertError.message);
                }
            }

            setSuccess('Sales user assigned successfully');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-50 w-full h-screen p-4">
            <h2 className="text-2xl font-semibold mb-8 text-center">Shipper Users</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
          <div className='flex justify-center'>
                <div className="w-4/5 overflow-auto bg-white rounded-lg shadow-md">
                    <table className="w-full">
                        <thead className="bg-ntsBlue text-white">
                            <tr>
                                <th className="py-2 px-4 text-left">Company Name</th>
                                <th className="py-2 px-4 text-left">Industry</th>
                                <th className="py-2 px-4 text-left">Company Size</th>
                                <th className="py-2 px-4 text-left">Profiles</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company) => (
                                <tr key={company.id} className="border-t">
                                    <td className="py-1 px-4">{company.name}</td>
                                    <td className="py-1 px-4">{company.industry}</td>
                                    <td className="py-1 px-4">{company.company_size}</td>
                                    <td className="py-1 px-4">
                                        {getProfilesForCompany(company.id).map(profile => (
                                            <div key={profile.id} className="flex flex-col mb-2">
                                                <span>{profile.first_name} {profile.last_name}</span>
                                                <span>{profile.email}</span>
                                                <span>{profile.phone_number}</span>
                                            </div>
                                        ))}
                                    </td>
                                    <td className="py-1 px-4">
                                        <select
                                            value={selectedSalesUserId || ''}
                                            onChange={(e) => setSelectedSalesUserId(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ntsBlue"
                                        >
                                            <option value="">Select a sales user</option>
                                            {ntsUsers
                                                .filter((user) => user.role === 'sales')
                                                .map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.first_name} {user.last_name}
                                                    </option>
                                                ))}
                                        </select>
                                        <button
                                            onClick={() => handleAssignSalesUser(company.id)}
                                            className="mt-2 px-4 py-2 bg-ntsLightBlue text-white rounded-lg hover:bg-ntsBlue transition duration-200"
                                        >
                                            Assign
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
          </div>
        </div>
    );
};

export default ShipperUserManagement;