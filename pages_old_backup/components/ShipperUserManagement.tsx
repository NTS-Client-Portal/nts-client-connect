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
    const [companySalesAssignments, setCompanySalesAssignments] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedSalesUserIds, setSelectedSalesUserIds] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState<string | null>(null);
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [industryFilter, setIndustryFilter] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [assignmentFilter, setAssignmentFilter] = useState(''); // 'assigned', 'unassigned', or ''
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

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
        try {
            // Fetch all companies
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('*');
                
            if (companiesError) {
                setError(companiesError.message);
                return;
            }
            
            setCompanies(companiesData as Company[]);
            
            // Fetch company sales assignments
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('company_sales_users')
                .select('company_id, sales_user_id');
                
            if (assignmentsError) {
                setError(assignmentsError.message);
                return;
            }
            
            // Create a mapping of company_id to array of sales_user_ids
            const assignmentsMap: Record<string, string[]> = {};
            assignmentsData.forEach((assignment: any) => {
                if (!assignmentsMap[assignment.company_id]) {
                    assignmentsMap[assignment.company_id] = [];
                }
                assignmentsMap[assignment.company_id].push(assignment.sales_user_id);
            });
            setCompanySalesAssignments(assignmentsMap);
            
        } catch (err) {
            setError('Error fetching companies and assignments');
        } finally {
            setLoading(false);
        }
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

    const getAssignedSalesUsers = (companyId: string) => {
        const salesUserIds = companySalesAssignments[companyId] || [];
        return ntsUsers.filter(user => salesUserIds.includes(user.id));
    };

    // Filter and search logic
    const filteredCompanies = companies.filter(company => {
        const matchesSearch = !searchTerm || 
            company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesIndustry = !industryFilter || company.industry === industryFilter;
        const matchesSize = !sizeFilter || company.company_size === sizeFilter;
        
        const hasAssignedSalesReps = getAssignedSalesUsers(company.id).length > 0;
        const matchesAssignment = !assignmentFilter || 
            (assignmentFilter === 'assigned' && hasAssignedSalesReps) ||
            (assignmentFilter === 'unassigned' && !hasAssignedSalesReps);
            
        return matchesSearch && matchesIndustry && matchesSize && matchesAssignment;
    });

    // Pagination logic
    const totalItems = filteredCompanies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    // Get unique industries and sizes for filter dropdowns
    const uniqueIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean))].sort();
    const uniqueSizes = [...new Set(companies.map(c => c.company_size).filter(Boolean))].sort();

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, industryFilter, sizeFilter, assignmentFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setIndustryFilter('');
        setSizeFilter('');
        setAssignmentFilter('');
        setCurrentPage(1);
        setShowAdvancedFilters(false);
    };

    const toggleCompanyExpansion = (companyId: string) => {
        setExpandedCompanies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(companyId)) {
                newSet.delete(companyId);
            } else {
                newSet.add(companyId);
            }
            return newSet;
        });
    };

    const handleUnassignSalesUser = async (companyId: string, salesUserId?: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (salesUserId) {
                // Unassign specific sales user
                const { error: deleteError } = await supabase
                    .from('company_sales_users')
                    .delete()
                    .eq('company_id', companyId)
                    .eq('sales_user_id', salesUserId);

                if (deleteError) {
                    throw new Error(deleteError.message);
                }

                // Update local state - remove specific user
                setCompanySalesAssignments(prev => {
                    const updated = { ...prev };
                    if (updated[companyId]) {
                        updated[companyId] = updated[companyId].filter(id => id !== salesUserId);
                        if (updated[companyId].length === 0) {
                            delete updated[companyId];
                        }
                    }
                    return updated;
                });
            } else {
                // Unassign all sales users for this company
                const { error: deleteError } = await supabase
                    .from('company_sales_users')
                    .delete()
                    .eq('company_id', companyId);

                if (deleteError) {
                    throw new Error(deleteError.message);
                }

                // Update local state - remove all assignments
                const updatedAssignments = { ...companySalesAssignments };
                delete updatedAssignments[companyId];
                setCompanySalesAssignments(updatedAssignments);
            }

            setSuccess('Sales user unassigned successfully');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSalesUser = async (companyId: string) => {
        const selectedSalesUserId = selectedSalesUserIds[companyId];
        
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
            
            // Update local state to reflect the change
            setCompanySalesAssignments(prev => {
                const updated = { ...prev };
                if (!updated[companyId]) {
                    updated[companyId] = [];
                }
                // Add the new assignment if it's not already there
                if (!updated[companyId].includes(selectedSalesUserId)) {
                    updated[companyId].push(selectedSalesUserId);
                }
                return updated;
            });
            
            // Clear the selected sales user for this company
            setSelectedSalesUserIds(prev => ({
                ...prev,
                [companyId]: ''
            }));
            
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 w-full p-6">
            <div className="max-w-10/12 mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipper Management</h1>
                    <p className="text-gray-600">Manage company assignments and sales representative relationships</p>
                </div>

                {/* Status Messages */}
                {loading && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                            <p className="text-blue-800 font-medium">Loading...</p>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}
                
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
                        <p className="text-green-800 font-medium">{success}</p>
                    </div>
                )}

               {/* Compact Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Quick Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={assignmentFilter}
                                onChange={(e) => setAssignmentFilter(e.target.value)}
                                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                            >
                                <option value="">All Companies</option>
                                <option value="assigned">Has Sales Rep</option>
                                <option value="unassigned">No Sales Rep</option>
                            </select>

                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-sm flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                                </svg>
                                Filters
                                <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {(searchTerm || industryFilter || sizeFilter || assignmentFilter) && (
                                <button
                                    onClick={clearAllFilters}
                                    className="px-3 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium text-sm"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Advanced Filters (Collapsible) */}
                    {showAdvancedFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                    <select
                                        value={industryFilter}
                                        onChange={(e) => setIndustryFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                    >
                                        <option value="">All Industries</option>
                                        {uniqueIndustries.map(industry => (
                                            <option key={industry} value={industry}>{industry}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                                    <select
                                        value={sizeFilter}
                                        onChange={(e) => setSizeFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                    >
                                        <option value="">All Sizes</option>
                                        {uniqueSizes.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Summary */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600">
                            <p>
                                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} companies
                                {filteredCompanies.length !== companies.length && ` (filtered from ${companies.length} total)`}
                            </p>
                            {(searchTerm || industryFilter || sizeFilter || assignmentFilter) && (
                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                        Active Filters
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>                    {/* Main Table Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
                                    <tr>
                                        <th className="py-4 px-6 text-left font-semibold">Company</th>
                                        <th className="py-4 px-6 text-left font-semibold">Industry</th>
                                        <th className="py-4 px-6 text-left font-semibold">Size</th>
                                        <th className="py-4 px-6 text-left font-semibold">Assigned Sales Reps</th>
                                        <th className="py-4 px-6 text-left font-semibold">Company Users</th>
                                        <th className="py-4 px-6 text-left font-semibold">Manage Assignment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedCompanies.map((company, index) => {
                                        const assignedSalesUsers = getAssignedSalesUsers(company.id);
                                        return (
                                            <tr 
                                                key={company.id} 
                                                className={`hover:bg-gray-50 transition-colors duration-150 ${
                                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                                                }`}
                                            >
                                                {/* Company Info */}
                                                <td className="py-6 px-6">
                                                    <div className="flex flex-col">
                                                        <h3 className="font-semibold text-gray-900 text-lg">{company.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">ID: {company.id.slice(0, 8)}...</p>
                                                    </div>
                                                </td>
                                                
                                                {/* Industry */}
                                                <td className="py-6 px-6">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm text-nowrap font-medium bg-blue-100 text-blue-800">
                                                        {company.industry || 'Not specified'}
                                                    </span>
                                                </td>
                                                
                                                {/* Company Size */}
                                                <td className="py-6 px-6">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm text-nowrap font-medium bg-purple-100 text-purple-800">
                                                        {company.company_size || 'Unknown'}
                                                    </span>
                                                </td>
                                                
                                                {/* Assigned Sales Reps */}
                                                <td className="py-6 px-6">
                                                    {assignedSalesUsers.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {assignedSalesUsers.map((user) => (
                                                                <div key={user.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                                                            <span className="text-white text-sm font-semibold">
                                                                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-emerald-800 font-medium text-sm">
                                                                                {user.first_name} {user.last_name}
                                                                            </p>
                                                                            <p className="text-emerald-600 text-xs">{user.email}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleUnassignSalesUser(company.id, user.id)}
                                                                        className="ml-3 px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors duration-200 font-medium"
                                                                        title="Remove this sales rep"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4">
                                                            <div className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                No sales rep assigned
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                
                                                {/* Company Users */}
                                                <td className="py-6 px-6">
                                                    <div className="space-y-3">
                                                        {(() => {
                                                            const companyProfiles = getProfilesForCompany(company.id);
                                                            const isExpanded = expandedCompanies.has(company.id);
                                                            const displayCount = isExpanded ? companyProfiles.length : Math.min(2, companyProfiles.length);
                                                            
                                                            if (companyProfiles.length === 0) {
                                                                return (
                                                                    <div className="text-center py-2">
                                                                        <span className="text-sm text-gray-400 italic">No users found</span>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div>
                                                                    {/* User Summary Header */}
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                                                </svg>
                                                                                <span className="text-sm font-medium text-gray-700">
                                                                                    {companyProfiles.length} user{companyProfiles.length !== 1 ? 's' : ''}
                                                                                </span>
                                                                            </div>
                                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                                companyProfiles.length <= 5 
                                                                                    ? 'bg-green-100 text-green-800' 
                                                                                    : companyProfiles.length <= 15 
                                                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                                                    : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {companyProfiles.length <= 5 ? 'Small' : companyProfiles.length <= 15 ? 'Medium' : 'Large'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {companyProfiles.length > 2 && (
                                                                            <button
                                                                                onClick={() => toggleCompanyExpansion(company.id)}
                                                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                                                                            >
                                                                                <span className="text-gray-600">
                                                                                    {isExpanded ? 'Show Less' : `+${companyProfiles.length - 2} more`}
                                                                                </span>
                                                                                <svg className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                </svg>
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* User List */}
                                                                    <div className="space-y-2">
                                                                        {companyProfiles.slice(0, displayCount).map(profile => (
                                                                            <div key={profile.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-150">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shrink-0">
                                                                                        <span className="text-white text-xs font-semibold">
                                                                                            {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                                                            {profile.first_name} {profile.last_name}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                                                                                        {profile.phone_number && (
                                                                                            <p className="text-xs text-gray-500">{profile.phone_number}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    {/* User Status Indicator */}
                                                                                    <div className="shrink-0">
                                                                                        <div className="w-2 h-2 bg-green-400 rounded-full" title="Active user"></div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        
                                                                        {/* Collapsed State Summary */}
                                                                        {!isExpanded && companyProfiles.length > 2 && (
                                                                            <div className="bg-gray-25 border border-gray-150 rounded-lg p-2 text-center">
                                                                                <p className="text-xs text-gray-500">
                                                                                    and {companyProfiles.length - 2} more user{companyProfiles.length - 2 !== 1 ? 's' : ''}...
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                
                                                {/* Assignment Actions */}
                                                <td className="py-6 px-6">
                                                    <div className="space-y-3">
                                                        <select
                                                            value={selectedSalesUserIds[company.id] || ''}
                                                            onChange={(e) => setSelectedSalesUserIds(prev => ({
                                                                ...prev,
                                                                [company.id]: e.target.value
                                                            }))}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                                                        >
                                                            <option value="">Choose a sales rep...</option>
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
                                                            disabled={!selectedSalesUserIds[company.id]}
                                                            className="w-full px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                        >
                                                            {assignedSalesUsers.length > 0 ? '+ Add Another Rep' : 'Assign Sales Rep'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            {/* Empty State */}
                            {filteredCompanies.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    {companies.length === 0 ? (
                                        <>
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 4h2M9 15h2" />
                                            </svg>
                                            <h3 className="mt-2 text-lg font-medium text-gray-900">No companies found</h3>
                                            <p className="mt-1 text-gray-500">Get started by adding your first company.</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.82-5.172-2.172M15 11.25c0-3.07-2.19-5.25-5.25-5.25S4.5 8.18 4.5 11.25 6.68 16.5 9.75 16.5c1.09 0 2.1-.3 2.97-.83" />
                                            </svg>
                                            <h3 className="mt-2 text-lg font-medium text-gray-900">No companies match your filters</h3>
                                            <p className="mt-1 text-gray-500">Try adjusting your search criteria or clearing all filters.</p>
                                            <button
                                                onClick={clearAllFilters}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                            >
                                                Clear all filters
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
    
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                            <span className="font-medium">{totalPages}</span> pages
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            
                                            {/* Page Numbers */}
                                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                                let pageNumber;
                                                if (totalPages <= 7) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 4) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= totalPages - 3) {
                                                    pageNumber = totalPages - 6 + i;
                                                } else {
                                                    pageNumber = currentPage - 3 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNumber}
                                                        onClick={() => handlePageChange(pageNumber)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            pageNumber === currentPage
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
    
                                            <button
                                                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
            </div>
        </div>
    );
};

export default ShipperUserManagement;