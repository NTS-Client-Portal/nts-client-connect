// Utility functions for case-insensitive status handling across the application

export type StatusType = 'quote' | 'order' | 'archived' | 'rejected' | 'cancelled' | 'delivered' | 'pending' | 'in_progress' | 'completed' | 'dispatched' | 'picked_up';

export type BrokersStatusType = 'in_progress' | 'dispatched' | 'picked_up' | 'delivered' | 'cancelled';

/**
 * Normalizes a status string to lowercase and replaces spaces with underscores
 * @param status - The status string to normalize
 * @returns Normalized status string
 */
export function normalizeStatus(status: string | null | undefined): string {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Checks if a status matches a target status (case-insensitive)
 * @param status - The status to check
 * @param target - The target status to match against
 * @returns True if statuses match
 */
export function statusMatches(status: string | null | undefined, target: StatusType): boolean {
    return normalizeStatus(status) === target;
}

/**
 * Filters an array of quotes/orders by status (case-insensitive)
 * @param items - Array of items with status property
 * @param targetStatus - The status to filter by
 * @returns Filtered array
 */
export function filterByStatus<T extends { status?: string | null }>(
    items: T[], 
    targetStatus: StatusType
): T[] {
    return items.filter(item => statusMatches(item.status, targetStatus));
}

/**
 * Filters an array of quotes/orders by multiple statuses (case-insensitive)
 * @param items - Array of items with status property
 * @param targetStatuses - Array of statuses to filter by
 * @returns Filtered array
 */
export function filterByStatuses<T extends { status?: string | null }>(
    items: T[], 
    targetStatuses: StatusType[]
): T[] {
    return items.filter(item => 
        targetStatuses.some(status => statusMatches(item.status, status))
    );
}

/**
 * Gets the display name for a status (properly capitalized)
 * @param status - The status to get display name for
 * @returns Formatted display name
 */
export function getStatusDisplayName(status: string | null | undefined): string {
    if (!status) return 'Unknown';
    
    const normalized = normalizeStatus(status);
    
    switch (normalized) {
        case 'quote':
            return 'Quote';
        case 'order':
            return 'Order';
        case 'archived':
            return 'Archived';
        case 'rejected':
            return 'Rejected';
        case 'cancelled':
            return 'Cancelled';
        case 'delivered':
            return 'Delivered';
        case 'pending':
            return 'Pending';
        case 'in_progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        case 'dispatched':
            return 'Dispatched';
        case 'picked_up':
            return 'Picked Up';
        default:
            // Convert snake_case to Title Case
            return normalized
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
    }
}

/**
 * Gets CSS classes for status display
 * @param status - The status to get classes for
 * @returns CSS class string
 */
export function getStatusClasses(status: string | null | undefined): string {
    const normalized = normalizeStatus(status);
    
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (normalized) {
        case 'quote':
        case 'pending':
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'order':
        case 'in_progress':
            return `${baseClasses} bg-blue-100 text-blue-800`;
        case 'dispatched':
            return `${baseClasses} bg-purple-100 text-purple-800`;
        case 'picked_up':
            return `${baseClasses} bg-indigo-100 text-indigo-800`;
        case 'delivered':
        case 'completed':
            return `${baseClasses} bg-green-100 text-green-800`;
        case 'rejected':
        case 'cancelled':
            return `${baseClasses} bg-red-100 text-red-800`;
        case 'archived':
            return `${baseClasses} bg-gray-100 text-gray-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
}

/**
 * Validates if a status is a valid StatusType
 * @param status - The status to validate
 * @returns True if valid
 */
export function isValidStatus(status: string | null | undefined): status is StatusType {
    if (!status) return false;
    
    const validStatuses: StatusType[] = [
        'quote', 'order', 'archived', 'rejected', 'cancelled', 
        'delivered', 'pending', 'in_progress', 'completed', 
        'dispatched', 'picked_up'
    ];
    
    return validStatuses.includes(normalizeStatus(status) as StatusType);
}

/**
 * Creates a Supabase filter for case-insensitive status matching
 * This is useful for database queries where you need to match statuses
 * regardless of case or spacing
 */
export function createStatusFilter(targetStatus: StatusType) {
    return (query: any) => {
        // For PostgreSQL, we can use ILIKE or convert to lowercase
        return query.or(`status.ilike.${targetStatus},status.ilike.${targetStatus.replace('_', ' ')}`);
    };
}
