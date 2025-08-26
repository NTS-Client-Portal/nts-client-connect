// Company Name Utilities
// This provides safe access to canonical company names and handles the transition away from redundant fields

import { supabase } from './initSupabase';

/**
 * Get canonical company name safely
 * Uses companies.name as the single source of truth
 */
export async function getCanonicalCompanyName(companyId: string): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  if (error || !data) {
    console.error('Error fetching canonical company name:', error);
    return null;
  }

  return data.name;
}

/**
 * Get company name for a profile using JOIN
 * This replaces the need for profiles.company_name
 */
export async function getProfileCompanyName(profileId: string): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select(`
      companies!inner(name)
    `)
    .eq('id', profileId)
    .single();

  if (error || !data) {
    console.error('Error fetching profile company name:', error);
    return null;
  }

  return data.companies?.name || null;
}

/**
 * Get profiles by company ID with canonical company names
 */
export async function getProfilesByCompany(companyId: string) {
  const { data: profiles, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('company_id', companyId);

  if (error || !profiles) {
    console.error('Error fetching profiles by company:', error);
    return [];
  }

  const companyName = await getCanonicalCompanyName(companyId);
  
  return profiles.map((profile: any) => ({
    ...profile,
    canonical_company_name: companyName
  }));
}

/**
 * Get profile by user ID with canonical company name
 */
export async function getProfileByUser(userId: string) {
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    console.error('Error fetching profile by user:', error);
    return null;
  }

  const companyName = profile.company_id ? await getCanonicalCompanyName(profile.company_id) : null;
  
  return {
    ...profile,
    canonical_company_name: companyName
  };
}

/**
 * Get all profiles with canonical company names
 */
export async function getAllProfilesWithCompanyNames() {
  const { data: profiles, error } = await (supabase as any)
    .from('profiles')
    .select('*');

  if (error || !profiles) {
    console.error('Error fetching all profiles:', error);
    return [];
  }

  const profilesWithCompanyNames = await Promise.all(
    profiles.map(async (profile: any) => {
      const companyName = profile.company_id ? await getCanonicalCompanyName(profile.company_id) : null;
      return {
        ...profile,
        canonical_company_name: companyName
      };
    })
  );

  return profilesWithCompanyNames;
}

/**
 * Create or update company with proper name handling
 */
export async function updateCompanyName(companyId: string, name: string) {
  const { data, error } = await (supabase as any)
    .from('companies')
    .update({ 
      name,
      company_name: null // Clear redundant field
    })
    .eq('id', companyId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update profile to clear redundant company_name field (simplified)
 */
export async function clearProfileCompanyName(profileId: string) {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({ 
      company_name: null // Clear redundant field
    })
    .eq('id', profileId)
    .select('*')
    .single();

  return { data, error };
}

/**
 * Search companies by name (canonical only)
 */
export async function searchCompaniesByName(searchTerm: string, limit: number = 10) {
  const { data, error } = await (supabase as any)
    .from('companies')
    .select('id, name')
    .ilike('name', `%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching companies:', error);
    return [];
  }

  return data || [];
}

/**
 * Migration helper: Check for remaining redundant company_name usage
 */
export async function auditRedundantCompanyNames() {
  const issues = [];

  // Check companies with redundant company_name
  const { data: companiesWithRedundantNames } = await (supabase as any)
    .from('companies')
    .select('id, name, company_name')
    .not('company_name', 'is', null);

  if (companiesWithRedundantNames?.length > 0) {
    issues.push({
      table: 'companies',
      count: companiesWithRedundantNames.length,
      records: companiesWithRedundantNames
    });
  }

  // Check profiles with redundant company_name
  const { data: profilesWithRedundantNames } = await (supabase as any)
    .from('profiles')
    .select('id, company_name, company_id')
    .not('company_name', 'is', null);

  if (profilesWithRedundantNames?.length > 0) {
    issues.push({
      table: 'profiles',
      count: profilesWithRedundantNames.length,
      records: profilesWithRedundantNames
    });
  }

  return issues;
}

/**
 * Helper for template processing - use canonical company name
 */
export function processCompanyNameInTemplate(template: string, companyName: string) {
  // Replace both old and new template variables with canonical name
  return template
    .replace(/\{company\.company_name\}/g, companyName)
    .replace(/\{company\.name\}/g, companyName)
    .replace(/\{company_name\}/g, companyName);
}
