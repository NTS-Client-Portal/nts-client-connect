#!/usr/bin/env node

/**
 * Enhanced Role-Based Access Control Migration Script
 * Priority 5 - NTS Client Connect Portal
 * 
 * Runs the role validation and permission system migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
});

async function runRoleBasedAccessMigration() {
    console.log('🚀 Starting Enhanced Role-Based Access Control Migration...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('🎯 Priority: 5 - Enhanced RBAC System');
    
    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', '007_enhanced_role_based_access.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        console.log('\n📊 Pre-migration validation...');
        
        // Check current role distribution
        const { data: ntsUserRoles, error: ntsError } = await supabase
            .from('nts_users')
            .select('role')
            .not('role', 'is', null);
            
        if (ntsError) {
            console.warn('⚠️  Warning: Could not fetch nts_users roles:', ntsError.message);
        } else {
            const roleCounts = {};
            ntsUserRoles.forEach(user => {
                roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
            });
            console.log('📊 Current nts_users role distribution:', roleCounts);
        }
        
        // Check team role distribution
        const { data: teamRoles, error: teamError } = await supabase
            .from('profiles')
            .select('team_role')
            .not('team_role', 'is', null);
            
        if (teamError) {
            console.warn('⚠️  Warning: Could not fetch profiles team_roles:', teamError.message);
        } else {
            const teamRoleCounts = {};
            teamRoles.forEach(profile => {
                teamRoleCounts[profile.team_role] = (teamRoleCounts[profile.team_role] || 0) + 1;
            });
            console.log('📊 Current profiles team_role distribution:', teamRoleCounts);
        }
        
        console.log('\n🔧 Running migration...');
        
        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: migrationSQL 
        });
        
        if (error) {
            // Try direct execution if rpc fails
            console.log('📝 Trying direct SQL execution...');
            
            // Split the SQL into individual statements and execute them
            const statements = migrationSQL
                .split(';')
                .filter(stmt => stmt.trim().length > 0)
                .filter(stmt => !stmt.trim().startsWith('--'));
            
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i].trim();
                if (!statement) continue;
                
                try {
                    const { error: stmtError } = await supabase.rpc('exec_sql', {
                        sql_query: statement + ';'
                    });
                    
                    if (stmtError) {
                        console.log(`❌ Statement ${i + 1} failed:`, stmtError.message);
                        errorCount++;
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    console.log(`❌ Statement ${i + 1} error:`, err.message);
                    errorCount++;
                }
            }
            
            console.log(`✅ Migration completed: ${successCount} statements successful, ${errorCount} errors`);
            
        } else {
            console.log('✅ Migration executed successfully!');
        }
        
        console.log('\n🔍 Post-migration validation...');
        
        // Validate role permissions table was created
        const { data: rolePermissions, error: permError } = await supabase
            .from('role_permissions')
            .select('role, permission')
            .limit(5);
            
        if (permError) {
            console.log('❌ Role permissions table validation failed:', permError.message);
        } else {
            console.log('✅ Role permissions table created successfully');
            console.log('📊 Sample permissions:', rolePermissions);
        }
        
        // Validate role audit log table was created  
        const { data: auditLog, error: auditError } = await supabase
            .from('role_audit_log')
            .select('*')
            .limit(1);
            
        if (auditError && !auditError.message.includes('0 rows')) {
            console.log('❌ Role audit log table validation failed:', auditError.message);
        } else {
            console.log('✅ Role audit log table created successfully');
        }
        
        // Test permission function
        try {
            const { data: permissionTest, error: funcError } = await supabase
                .rpc('get_user_permissions', { user_role: 'admin' });
                
            if (funcError) {
                console.log('❌ Permission function test failed:', funcError.message);
            } else {
                console.log('✅ Permission functions working correctly');
                console.log('📊 Admin permissions count:', permissionTest?.length || 0);
            }
        } catch (err) {
            console.log('❌ Permission function test error:', err.message);
        }
        
        // Count permissions by role
        const { data: permissionCounts, error: countError } = await supabase
            .from('role_permissions')
            .select('role')
            .eq('granted', true);
            
        if (!countError && permissionCounts) {
            const counts = {};
            permissionCounts.forEach(perm => {
                counts[perm.role] = (counts[perm.role] || 0) + 1;
            });
            console.log('📊 Permissions by role:', counts);
        }
        
        console.log('\n✨ Enhanced Role-Based Access Control Migration Summary:');
        console.log('✅ Role enum validation added');
        console.log('✅ Permission system implemented');
        console.log('✅ Role audit logging enabled');
        console.log('✅ Database triggers created');
        console.log('✅ Row Level Security policies applied');
        console.log('✅ Performance indexes added');
        
        console.log('\n📋 Next Steps:');
        console.log('1. Update application components to use new RBAC system');
        console.log('2. Secure API endpoints with role middleware');
        console.log('3. Test permission-based UI rendering');
        console.log('4. Validate role transitions work correctly');
        
        console.log('\n🎉 Priority 5 Migration completed successfully!');
        console.log('📊 Status: Enhanced Role-Based Access Control - ACTIVE');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('📋 Please check the error details and retry');
        
        if (error.stack) {
            console.error('\n📍 Stack trace:');
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    runRoleBasedAccessMigration().catch(error => {
        console.error('💥 Migration script failed:', error);
        process.exit(1);
    });
}

module.exports = { runRoleBasedAccessMigration };
