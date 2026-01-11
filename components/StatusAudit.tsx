import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { StatusAuditEntry, getStatusLabel } from '@/lib/statusManagement';
import { Clock, User, ArrowRight } from 'lucide-react';

interface StatusAuditProps {
  quoteId: number;
  showHeader?: boolean;
}

const StatusAudit: React.FC<StatusAuditProps> = ({ quoteId, showHeader = true }) => {
  const [auditEntries, setAuditEntries] = useState<StatusAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditTrail();
  }, [quoteId]);

  const fetchAuditTrail = async () => {
    try {
      // Note: This will need to be implemented once the audit table is created
      // For now, we'll show a placeholder
      setLoading(false);
      
      // TODO: Uncomment once audit table is available
      /*
      const { data, error: fetchError } = await supabase
        .from('quote_status_audit')
        .select(`
          *,
          profiles!changed_by(first_name, last_name, email)
        `)
        .eq('quote_id', quoteId)
        .order('changed_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching audit trail:', fetchError);
        setError('Failed to load status history');
        return;
      }

      setAuditEntries(data || []);
      */
    } catch (err) {
      console.error('Error in fetchAuditTrail:', err);
      setError('Failed to load status history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading status history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-lg">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Status History</h3>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {auditEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Status Audit Trail Coming Soon</p>
            <p className="text-sm mt-2">
              The audit trail feature is currently being implemented. 
              Once complete, you'll be able to see a detailed history of all status changes.
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What this will include:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Who changed the status</li>
                <li>• When the change was made</li>
                <li>• Previous and new status values</li>
                <li>• Reason for the change (if provided)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {auditEntries.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {entry.old_status && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getStatusLabel(entry.old_status as any)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </>
                    )}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getStatusLabel(entry.new_status as any)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {entry.change_reason || 'Status updated'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.changed_at).toLocaleString()}
                    {entry.changed_by && ' • Changed by user'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusAudit;
