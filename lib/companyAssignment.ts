/**
 * Updated utility functions for standardized company assignment system
 * Use these functions throughout the application after migration
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Get the assigned sales user for a company
 */
export const getSalesUserForCompany = async (companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('company_sales_users')
      .select('sales_user_id, nts_users(first_name, last_name, email)')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching sales user for company:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

/**
 * Get all companies assigned to a sales user
 */
export const getCompaniesForSalesUser = async (salesUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('company_sales_users')
      .select(`
        company_id,
        assigned_at,
        companies(id, name, industry)
      `)
      .eq('sales_user_id', salesUserId);

    if (error) {
      console.error('Error fetching companies for sales user:', error.message);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
};

/**
 * Assign or reassign a sales user to a company
 */
export const assignSalesUserToCompany = async (
  companyId: string,
  salesUserId: string,
  assignedBy?: string
) => {
  try {
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('company_sales_users')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (existing) {
      // Update existing assignment
      const { error } = await supabase
        .from('company_sales_users')
        .update({ 
          sales_user_id: salesUserId,
          assigned_at: new Date().toISOString(),
          assigned_by: assignedBy || null
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating assignment:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      // Create new assignment
      const { error } = await supabase
        .from('company_sales_users')
        .insert({
          company_id: companyId,
          sales_user_id: salesUserId,
          assigned_at: new Date().toISOString(),
          assigned_by: assignedBy || null
        });

      if (error) {
        console.error('Error creating assignment:', error.message);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

/**
 * Remove assignment between company and sales user
 */
export const unassignSalesUserFromCompany = async (companyId: string) => {
  try {
    const { error } = await supabase
      .from('company_sales_users')
      .delete()
      .eq('company_id', companyId);

    if (error) {
      console.error('Error removing assignment:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

/**
 * Get companies that have no assigned sales user
 */
export const getUnassignedCompanies = async () => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        industry,
        created_at,
        profiles(count)
      `)
      .not('id', 'in', `(
        SELECT company_id 
        FROM company_sales_users 
        WHERE company_id IS NOT NULL
      )`);

    if (error) {
      console.error('Error fetching unassigned companies:', error.message);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
};

/**
 * Get assignment summary for admin dashboard
 */
export const getAssignmentSummary = async () => {
  try {
    const { data, error } = await supabase
      .from('company_sales_users')
      .select(`
        company_id,
        sales_user_id,
        assigned_at,
        companies(name, industry),
        nts_users(first_name, last_name, email)
      `);

    if (error) {
      console.error('Error fetching assignment summary:', error.message);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
};

/**
 * Validate that a sales user can access a specific company
 */
export const validateSalesUserAccess = async (salesUserId: string, companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('company_sales_users')
      .select('id')
      .eq('sales_user_id', salesUserId)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error validating access:', error.message);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
};

/**
 * Get notification recipients for a company (sales users assigned to that company)
 */
export const getNotificationRecipientsForCompany = async (companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('company_sales_users')
      .select(`
        sales_user_id,
        nts_users(id, email, first_name, last_name, email_notifications)
      `)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching notification recipients:', error.message);
      return [];
    }

    // Filter users who have email notifications enabled
    return data
      .map(item => item.nts_users)
      .filter(user => user && user.email_notifications !== false);
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
};
