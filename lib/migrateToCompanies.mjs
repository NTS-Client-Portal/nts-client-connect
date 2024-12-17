import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Log the environment variables to ensure they are loaded correctly
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

const migrateProfilesToCompanies = async () => {
    try {
        // Dynamically import the assignSalesUser function
        const { assignSalesUser } = await import('./assignBroker.mjs');

        // Fetch all profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');

        if (profilesError) {
            throw new Error(profilesError.message);
        }

        console.log(`Fetched ${profiles.length} profiles`);

        for (const profile of profiles) {
            const { company_name, company_id, company_size } = profile;

            if (company_name && company_id) {
                console.log(`Processing profile for user: ${profile.email}`);

                // Check if the company already exists in the companies table
                const { data: existingCompany, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', company_id)
                    .single();

                if (companyError && companyError.code !== 'PGRST116') {
                    throw new Error(companyError.message);
                }

                if (!existingCompany) {
                    // Insert the company into the companies table
                    const assignedSalesUserId = '2b5928cc-4f66-4be4-8d76-4eb91c55db00'; // Default assigned sales user ID
                    const assignedAt = new Date().toISOString(); // Current timestamp
                    const { data: newCompany, error: newCompanyError } = await supabase
                        .from('companies')
                        .insert({
                            id: company_id,
                            name: company_name,
                            company_name: company_name,
                            company_size: '1-10', // Force default company size
                            assigned_sales_user: assignedSalesUserId,
                            assigned_at: assignedAt,
                        })
                        .select()
                        .single();

                    if (newCompanyError) {
                        console.error(`Error inserting new company: ${newCompanyError.message}`);
                        console.error('Company data:', {
                            id: company_id,
                            name: company_name,
                            company_name: company_name,
                            company_size: '1-10',
                            assigned_sales_user: assignedSalesUserId,
                            assigned_at: assignedAt,
                        });
                        continue;
                    }

                    console.log(`Inserted new company: ${company_name} with ID: ${company_id} into companies table`);
                    console.log('New company data:', newCompany);

                    // Assign a sales user to the new company
                    await assignSalesUser(company_id);
                } else {
                    console.log(`Existing company found: ${company_name} with ID: ${company_id}`);
                    console.log('Existing company data:', existingCompany);

                    // Update the existing company with missing fields
                    const updates = {};
                    if (!existingCompany.assigned_sales_user) updates.assigned_sales_user = '2b5928cc-4f66-4be4-8d76-4eb91c55db00';
                    if (!existingCompany.assigned_at) updates.assigned_at = new Date().toISOString();
                    if (!existingCompany.company_name) updates.company_name = company_name;
                    if (!existingCompany.company_size) updates.company_size = '1-10'; // Force default company size

                    if (Object.keys(updates).length > 0) {
                        console.log(`Updating existing company: ${company_name} with ID: ${company_id} with updates:`, updates);
                        const { error: updateCompanyError } = await supabase
                            .from('companies')
                            .update(updates)
                            .eq('id', company_id);

                        if (updateCompanyError) {
                            console.error(`Error updating existing company: ${updateCompanyError.message}`);
                            continue;
                        }

                        console.log(`Updated existing company: ${company_name} with ID: ${company_id} in companies table`);
                    }
                }

                // Update the profile with the new company_id if necessary
                if (profile.company_id !== company_id) {
                    const { error: profileUpdateError } = await supabase
                        .from('profiles')
                        .update({ company_id: company_id })
                        .eq('id', profile.id);

                    if (profileUpdateError) {
                        throw new Error(profileUpdateError.message);
                    }

                    console.log(`Updated profile for user: ${profile.email} with company_id: ${company_id} in profiles table`);
                }
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error during migration:', error.message);
    }
};

// Run the migration script
migrateProfilesToCompanies();