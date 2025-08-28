/**
 * API Route: /api/admin/migrate-legacy-roles
 * Purpose: Migrate legacy role names to enhanced RBAC format
 * Priority 5 - Enhanced RBAC System
 * 
 * Security: Requires SUPER_ADMIN role
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withSuperAdminAccess } from '../../../lib/apiMiddleware';
import { migrateLegacyRoles } from '../../../lib/roleUtils';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  errors: string[];
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<MigrationResult>
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      migratedCount: 0,
      errors: ['Only POST method is allowed']
    });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    
    console.log('🚀 Starting legacy role migration process...');
    
    const errors: string[] = [];
    let migratedCount = 0;

    // Step 1: Migrate nts_users table
    console.log('📋 Checking nts_users table for legacy roles...');
    
    const { data: ntsUsers, error: ntsError } = await supabase
      .from('nts_users')
      .select('id, email, role')
      .eq('role', 'superadmin'); // Only target legacy superadmin
      
    if (ntsError) {
      console.error('❌ Error fetching nts_users:', ntsError);
      errors.push(`Failed to fetch nts_users: ${ntsError.message}`);
    } else if (ntsUsers && ntsUsers.length > 0) {
      console.log(`📊 Found ${ntsUsers.length} users with legacy 'superadmin' role`);
      
      for (const user of ntsUsers) {
        try {
          const { error: updateError } = await supabase
            .from('nts_users')
            .update({ role: 'super_admin' })
            .eq('id', user.id);
            
          if (updateError) {
            console.error(`❌ Failed to update user ${user.id}:`, updateError);
            errors.push(`Failed to update user ${user.email}: ${updateError.message}`);
          } else {
            console.log(`✅ Migrated user ${user.email}: superadmin → super_admin`);
            migratedCount++;
          }
        } catch (userError) {
          console.error(`❌ Exception updating user ${user.id}:`, userError);
          errors.push(`Exception updating user ${user.email}: ${userError}`);
        }
      }
    } else {
      console.log('ℹ️ No legacy superadmin roles found in nts_users');
    }

    // Step 2: Check for other legacy role patterns
    console.log('🔍 Checking for other legacy role patterns...');
    
    const legacyPatterns = ['broker', 'customer_support', 'administrator'];
    
    for (const pattern of legacyPatterns) {
      const { data: legacyUsers, error: patternError } = await supabase
        .from('nts_users')
        .select('id, email, role')
        .eq('role', pattern);
        
      if (patternError) {
        console.error(`❌ Error checking pattern ${pattern}:`, patternError);
        errors.push(`Failed to check pattern ${pattern}: ${patternError.message}`);
        continue;
      }
      
      if (legacyUsers && legacyUsers.length > 0) {
        console.log(`📊 Found ${legacyUsers.length} users with legacy '${pattern}' role`);
        
        // Map legacy patterns to new roles
        let newRole: string;
        switch (pattern) {
          case 'broker':
            newRole = 'sales';
            break;
          case 'customer_support':
            newRole = 'support';
            break;
          case 'administrator':
            newRole = 'admin';
            break;
          default:
            newRole = 'sales'; // Default fallback
        }
        
        for (const user of legacyUsers) {
          try {
            const { error: updateError } = await supabase
              .from('nts_users')
              .update({ role: newRole })
              .eq('id', user.id);
              
            if (updateError) {
              console.error(`❌ Failed to update user ${user.id}:`, updateError);
              errors.push(`Failed to update user ${user.email}: ${updateError.message}`);
            } else {
              console.log(`✅ Migrated user ${user.email}: ${pattern} → ${newRole}`);
              migratedCount++;
            }
          } catch (userError) {
            console.error(`❌ Exception updating user ${user.id}:`, userError);
            errors.push(`Exception updating user ${user.email}: ${userError}`);
          }
        }
      }
    }

    // Step 3: Create audit log entry
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const auditEntry = {
        action: 'role_migration',
        table_name: 'nts_users',
        record_id: null,
        old_values: { note: 'Legacy role migration' },
        new_values: { migrated_count: migratedCount },
        user_id: user?.id || 'system',
        timestamp: new Date().toISOString()
      };
      
      // Note: This would normally go to an audit_log table when migration is run
      console.log('📝 Audit entry:', auditEntry);
      
    } catch (auditError) {
      console.error('❌ Failed to create audit log:', auditError);
      errors.push(`Failed to create audit log: ${auditError}`);
    }

    const result: MigrationResult = {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully migrated ${migratedCount} user role(s)`
        : `Migration completed with ${errors.length} error(s). Migrated ${migratedCount} user role(s)`,
      migratedCount,
      errors
    };

    console.log('🏁 Migration process completed:', result);

    return res.status(200).json(result);

  } catch (error) {
    console.error('💥 Fatal error in migration process:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Fatal error during migration process',
      migratedCount: 0,
      errors: [`Fatal error: ${error}`]
    });
  }
};

export default withSuperAdminAccess(handler);

/**
 * Example Usage:
 * 
 * POST /api/admin/migrate-legacy-roles
 * 
 * Headers:
 * Authorization: Bearer <supabase-jwt-token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Successfully migrated 3 user role(s)",
 *   "migratedCount": 3,
 *   "errors": []
 * }
 */
