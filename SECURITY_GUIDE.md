# 🔒 NTS Client Connect - Security Implementation Guide

## Pre-Penetration Testing Security Checklist

### ✅ Row Level Security (RLS) Implementation

#### **Core Security Principles Implemented:**

1. **Data Isolation by Company**
   - Shippers can only see data from their own company
   - Sales reps can only see data from assigned companies
   - Admins have full access with proper authentication

2. **Role-Based Access Control**
   - 4 distinct user roles: Shipper, Sales Rep, Manager, Admin/Super Admin
   - Granular permissions per role and table
   - Hierarchical access patterns

3. **Multi-User Type Architecture**
   - `profiles` table: Customer/shipper users
   - `nts_users` table: Internal NTS staff
   - Proper junction tables for company assignments

---

## 🚀 Implementation Steps

### Step 1: Apply Updated Schema
```sql
-- Run the updated schema.sql to ensure all tables have proper structure
-- Includes company_id fields critical for RLS
psql -U postgres -d your_database -f schema.sql
```

### Step 2: Apply RLS Policies
```sql
-- Apply comprehensive RLS policies
psql -U postgres -d your_database -f rls_policies.sql
```

### Step 3: Verify RLS is Active
```sql
-- Check that RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

### Step 4: Test with Real Users
```sql
-- Use test_rls.sql with actual authenticated users
psql -U postgres -d your_database -f test_rls.sql
```

---

## 🎯 Critical Security Features

### **Table-Level Security:**

| Table | Shipper Access | Sales Rep Access | Admin Access |
|-------|----------------|------------------|--------------|
| `companies` | Own company only | Assigned companies | All companies |
| `profiles` | Own company + self | Assigned companies | All profiles |
| `nts_users` | Assigned reps only | Self + team | All NTS users |
| `shippingquotes` | Own company | Assigned companies | All quotes |
| `orders` | Own company | Assigned companies | All orders |
| `freight` | Own records | From assigned companies | All freight |
| `notifications` | Own notifications | Own notifications | All notifications |
| `documents` | Own documents | From assigned companies | All documents |

### **Key Security Functions:**
- `is_nts_user()` - Identifies internal staff
- `is_shipper()` - Identifies customer users  
- `get_user_company_id()` - Gets user's company
- `get_assigned_company_ids()` - Gets sales rep assignments
- `is_admin_user()` - Identifies admin privileges

---

## 🔍 Penetration Testing Preparation

### **Expected Attack Vectors & Defenses:**

#### 1. **SQL Injection**
- **Defense**: RLS policies use parameterized functions
- **Test**: Attempt injection in quote forms, search fields
- **Verification**: All database access goes through RLS filters

#### 2. **Horizontal Privilege Escalation**
- **Defense**: Company-based data isolation
- **Test**: Shipper trying to access another company's data
- **Verification**: Zero cross-company data leakage

#### 3. **Vertical Privilege Escalation**
- **Defense**: Role-based function checks
- **Test**: Shipper trying to perform admin functions
- **Verification**: Only admins can create/delete companies and users

#### 4. **Direct Database Access**
- **Defense**: RLS enforced at database level
- **Test**: Direct API calls bypassing application logic
- **Verification**: Database blocks unauthorized queries regardless of access method

#### 5. **Data Enumeration**
- **Defense**: Limited data exposure per user role
- **Test**: Attempting to list all companies/users
- **Verification**: Users only see data they're authorized for

#### 6. **Authentication Bypass**
- **Defense**: All policies require `auth.uid()`
- **Test**: Unauthenticated requests
- **Verification**: No data access without valid session

---

## 🚨 Critical Vulnerabilities to Watch For

### **High Priority:**
1. **Missing company_id fields** - Ensure all quotes/orders have company_id set
2. **Incorrect user type detection** - Verify is_nts_user() vs is_shipper() logic
3. **Sales rep assignment gaps** - Ensure all companies have assigned reps
4. **Admin escalation** - Verify only legitimate admins have admin role

### **Medium Priority:**
1. **Notification leakage** - Check both user_id and nts_user_id handling
2. **Document access** - Verify file access restrictions
3. **Freight inventory isolation** - Ensure no cross-company freight visibility
4. **Team manager permissions** - Verify team managers can't exceed company bounds

### **Low Priority:**
1. **Usage stats privacy** - Verify stats don't leak user behavior
2. **Maintenance record access** - Check freight-based access controls
3. **Legacy data migration** - Ensure migrated data has proper company_id values

---

## 🔧 Post-Implementation Verification

### **Automated Tests:**
```bash
# Run application-level tests
npm run test:security

# Database-level RLS tests  
psql -U postgres -d your_database -f test_rls.sql
```

### **Manual Verification Checklist:**

#### ✅ **Shipper User Tests:**
- [ ] Can only see own company's quotes/orders
- [ ] Cannot see other companies' data
- [ ] Can create quotes with proper company_id
- [ ] Cannot access admin functions
- [ ] Team managers can manage team members

#### ✅ **Sales Rep Tests:**
- [ ] Can see all assigned companies' data
- [ ] Cannot see unassigned companies
- [ ] Can update quotes from assigned companies
- [ ] Cannot create/delete companies
- [ ] Can receive notifications properly

#### ✅ **Admin Tests:**
- [ ] Can see all data across all companies
- [ ] Can create/update/delete companies
- [ ] Can manage user assignments
- [ ] Can access admin dashboards
- [ ] System functions work correctly

#### ✅ **Cross-User Tests:**
- [ ] No data leakage between companies
- [ ] No privilege escalation possible
- [ ] Proper notification routing
- [ ] File access restrictions work
- [ ] API endpoints respect RLS

---

## 🛡️ Additional Security Recommendations

### **Application Layer:**
1. **Input Validation**: Sanitize all form inputs
2. **Session Management**: Implement secure session timeouts
3. **File Upload Security**: Restrict file types and scan uploads
4. **API Rate Limiting**: Prevent brute force attacks
5. **Logging**: Log all security-relevant events

### **Infrastructure Layer:**
1. **HTTPS Enforcement**: All connections must be encrypted
2. **Database Encryption**: Encrypt data at rest
3. **Network Security**: Proper firewall rules
4. **Backup Security**: Encrypt and secure database backups
5. **Environment Variables**: Secure credential management

### **Monitoring:**
1. **Failed Login Attempts**: Monitor and alert on suspicious activity
2. **Data Access Patterns**: Log unusual data access
3. **Performance Monitoring**: Ensure RLS doesn't impact performance
4. **Error Logging**: Secure error handling without data exposure

---

## 📋 Pre-Pen-Test Final Checklist

- [ ] All RLS policies applied and tested
- [ ] Schema includes all necessary company_id fields
- [ ] Helper functions working correctly
- [ ] No test data in production
- [ ] All environment variables secured
- [ ] Application error handling doesn't leak data
- [ ] File upload restrictions in place
- [ ] API endpoints use proper authentication
- [ ] Database backups are encrypted
- [ ] Monitoring and logging configured
- [ ] SSL/TLS certificates valid and enforced
- [ ] Dependencies updated to latest secure versions

---

## 🆘 Emergency Response Plan

If penetration testing reveals vulnerabilities:

1. **Immediate Response**: Disable affected features/endpoints
2. **Assessment**: Determine scope and impact
3. **Patching**: Apply fixes in staging environment first
4. **Verification**: Re-test fixes thoroughly  
5. **Deployment**: Deploy fixes with monitoring
6. **Communication**: Notify stakeholders of resolution

---

**Remember**: Security is an ongoing process. Plan for regular security reviews and updates as the application evolves.
