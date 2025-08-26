// Status Management System
// This provides type-safe status handling with validation and display utilities

export type QuoteStatus = 
  | 'pending'      // Initial state when quote is created
  | 'quoted'       // Sales rep has provided a quote  
  | 'approved'     // Customer approved the quote
  | 'order'        // Converted to order
  | 'in_transit'   // Order is being transported
  | 'delivered'    // Successfully delivered
  | 'cancelled'    // Cancelled by customer or broker
  | 'rejected'     // Rejected by customer or broker
  | 'archived';    // Archived for historical purposes

export type BrokersStatus = 
  | 'in_progress'     // Broker is working on it
  | 'need_more_info'  // Needs additional information
  | 'priced'          // Broker has provided pricing
  | 'dispatched'      // Dispatched to carrier
  | 'picked_up'       // Picked up by carrier
  | 'delivered'       // Delivered to destination
  | 'cancelled';      // Cancelled

// Status display mappings
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Pending',
  quoted: 'Quoted',
  approved: 'Approved',
  order: 'Order',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  archived: 'Archived'
};

export const BROKERS_STATUS_LABELS: Record<BrokersStatus, string> = {
  in_progress: 'In Progress',
  need_more_info: 'Need More Info',
  priced: 'Priced',
  dispatched: 'Dispatched',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

// Status color/styling mappings
export const QUOTE_STATUS_STYLES: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  quoted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  order: 'bg-purple-50 text-purple-700 border-purple-200',
  in_transit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  archived: 'bg-gray-50 text-gray-700 border-gray-200'
};

export const BROKERS_STATUS_STYLES: Record<BrokersStatus, string> = {
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  need_more_info: 'bg-amber-50 text-amber-700 border-amber-200', 
  priced: 'bg-green-50 text-green-700 border-green-200',
  dispatched: 'bg-purple-50 text-purple-700 border-purple-200',
  picked_up: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200'
};

// Validation functions
export function isValidQuoteStatus(status: string): status is QuoteStatus {
  return Object.keys(QUOTE_STATUS_LABELS).includes(status);
}

export function isValidBrokersStatus(status: string): status is BrokersStatus {
  return Object.keys(BROKERS_STATUS_LABELS).includes(status);
}

// Status transition validation
export const VALID_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  pending: ['quoted', 'cancelled', 'rejected'],
  quoted: ['approved', 'rejected', 'cancelled'],
  approved: ['order', 'cancelled'],
  order: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['archived'],
  cancelled: ['archived'],
  rejected: ['archived'],
  archived: [] // Terminal state
};

export const VALID_BROKERS_STATUS_TRANSITIONS: Record<BrokersStatus, BrokersStatus[]> = {
  in_progress: ['need_more_info', 'priced', 'cancelled'],
  need_more_info: ['in_progress', 'priced', 'cancelled'],
  priced: ['dispatched', 'cancelled'],
  dispatched: ['picked_up', 'cancelled'],
  picked_up: ['delivered', 'cancelled'],
  delivered: [], // Terminal state
  cancelled: [] // Terminal state
};

// Utility functions
export function getStatusLabel(status: QuoteStatus | BrokersStatus): string {
  return QUOTE_STATUS_LABELS[status as QuoteStatus] || BROKERS_STATUS_LABELS[status as BrokersStatus] || status;
}

export function getStatusStyle(status: QuoteStatus | BrokersStatus): string {
  return QUOTE_STATUS_STYLES[status as QuoteStatus] || BROKERS_STATUS_STYLES[status as BrokersStatus] || 'bg-gray-50 text-gray-700 border-gray-200';
}

export function canTransitionTo(currentStatus: QuoteStatus, newStatus: QuoteStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export function canBrokersTransitionTo(currentStatus: BrokersStatus, newStatus: BrokersStatus): boolean {
  return VALID_BROKERS_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export function getValidTransitions(status: QuoteStatus): QuoteStatus[] {
  return VALID_STATUS_TRANSITIONS[status] || [];
}

export function getValidBrokersTransitions(status: BrokersStatus): BrokersStatus[] {
  return VALID_BROKERS_STATUS_TRANSITIONS[status] || [];
}

// Status progression helpers
export function getStatusOrder(): QuoteStatus[] {
  return ['pending', 'quoted', 'approved', 'order', 'in_transit', 'delivered', 'archived'];
}

export function getBrokersStatusOrder(): BrokersStatus[] {
  return ['in_progress', 'need_more_info', 'priced', 'dispatched', 'picked_up', 'delivered'];
}

export function getStatusProgress(status: QuoteStatus): number {
  const order = getStatusOrder();
  const index = order.indexOf(status);
  return index === -1 ? 0 : (index / (order.length - 1)) * 100;
}

// Audit trail helper type
export interface StatusAuditEntry {
  id: number;
  quote_id: number;
  old_status: string | null;
  new_status: string;
  old_brokers_status: string | null;
  new_brokers_status: string;
  changed_by: string | null;
  changed_at: string;
  change_reason: string | null;
}
