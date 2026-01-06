import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabaseClient } from '@/lib/supabase/provider';
import { useNtsUsers } from '@/context/NtsUsersContext';
import { Database } from '@/lib/database.types';
import { 
  Mail, 
  PhoneForwarded, 
  Building2, 
  Users, 
  Package, 
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Calendar,
  Truck
} from 'lucide-react'

interface Profile {
  address: string | null;
  company_id: string | null;
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
  name: string | null; // Use canonical name field
  company_size: string | null;
  id: string;
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
  year: string | null;
  make: string | null;
  model: string | null;
}

const Crm: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const { userProfile } = useNtsUsers();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('name');

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
          .in('company_id', companyIds)
          .is('price', null); // Fetch quotes that do not have a price

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
    if (searchColumn === 'name') {
      return company.name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchColumn === 'first_name' || searchColumn === 'last_name' || searchColumn === 'email') {
      return getProfilesForCompany(company.id).some(profile =>
        profile[searchColumn]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return false;
  });

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            Assigned Customers
          </h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships and track quotes</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          {filteredCompanies.length} Companies
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <label id="search-column-label" className="sr-only">
              Search by
            </label>
            <select
              aria-labelledby="search-column-label"
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Company Name</option>
              <option value="first_name">First Name</option>
              <option value="last_name">Last Name</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Active Quotes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <Link href={`/companies/${company.id}`} className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1">
                            {company.name}
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <p className="text-sm text-gray-500">{company.company_size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getProfilesForCompany(company.id).map(profile => (
                          <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{profile.first_name} {profile.last_name}</p>
                              <p className="text-sm text-gray-500">{profile.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <a 
                                href={`mailto:${profile.email}`}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150 tooltip"
                                title={`Email ${profile.first_name}`}
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                              <a 
                                href={`tel:${profile.phone_number}`}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-150 tooltip"
                                title={`Call ${profile.first_name}`}
                              >
                                <PhoneForwarded className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {(() => {
                          const companyQuotes = getShippingQuotesForCompany(company.id);
                          const displayQuotes = companyQuotes.slice(0, 2); // Show only first 2 quotes
                          const remainingCount = companyQuotes.length - 2;
                          
                          return (
                            <>
                              {displayQuotes.map(quote => (
                                <div key={quote.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                      <Package className="w-3 h-3 mr-1" />
                                      Quote #{quote.id}
                                    </span>
                                    <span className="text-xs text-gray-500">New</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <MapPin className="w-3 h-3" />
                                      <span className="font-medium">Route:</span> {quote.origin_city}, {quote.origin_state} → {quote.destination_city}, {quote.destination_state}
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Truck className="w-3 h-3" />
                                      <span className="font-medium">Load:</span> {quote.year} {quote.make} {quote.model}
                                    </div>
                                    {quote.due_date && (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <Calendar className="w-3 h-3" />
                                        <span className="font-medium">Due:</span> {new Date(quote.due_date).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {remainingCount > 0 && (
                                <div className="text-center py-2">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    +{remainingCount} more quote{remainingCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                              
                              {companyQuotes.length === 0 && (
                                <p className="text-gray-500 text-sm italic">No active quotes</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredCompanies.map(company => (
          <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Company Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <Link href={`/companies/${company.id}`} className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                      {company.name}
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <p className="text-sm text-gray-600">{company.company_size}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Active Quotes</p>
                  <p className="text-lg font-bold text-blue-600">{getShippingQuotesForCompany(company.id).length}</p>
                </div>
              </div>
            </div>

            {/* Company Contacts */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Contacts ({getProfilesForCompany(company.id).length})
              </h3>
              <div className="space-y-2">
                {getProfilesForCompany(company.id).map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{profile.first_name} {profile.last_name}</p>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                      {profile.phone_number && (
                        <p className="text-sm text-gray-500">{profile.phone_number}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3">
                      <a 
                        href={`mailto:${profile.email}`}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150 touch-manipulation active:scale-95"
                        title={`Email ${profile.first_name}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      <a 
                        href={`tel:${profile.phone_number}`}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-150 touch-manipulation active:scale-95"
                        title={`Call ${profile.first_name}`}
                      >
                        <PhoneForwarded className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Quotes */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-600" />
                Shipping Quotes
              </h3>
              <div className="space-y-3">
                {getShippingQuotesForCompany(company.id).map(quote => (
                  <div key={quote.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Package className="w-3 h-3 mr-1" />
                        Quote #{quote.id}
                      </span>
                      <span className="text-xs text-emerald-600 font-medium">New</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-700">Route</p>
                          <p className="text-gray-600">{quote.origin_city}, {quote.origin_state} → {quote.destination_city}, {quote.destination_state}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Truck className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-700">Load Details</p>
                          <p className="text-gray-600">{quote.year} {quote.make} {quote.model}</p>
                        </div>
                      </div>
                      {quote.due_date && (
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-700">Due Date</p>
                            <p className="text-gray-600">{new Date(quote.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {getShippingQuotesForCompany(company.id).length === 0 && (
                  <div className="text-center py-4">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No active quotes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredCompanies.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Crm;