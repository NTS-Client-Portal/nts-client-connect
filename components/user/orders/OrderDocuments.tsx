import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Loader2,
    Paperclip,
    AlertCircle,
} from 'lucide-react';

interface OrderDocument {
    id: number;
    title: string | null;
    file_name: string | null;
    file_type: string | null;
    file_url: string | null;
    created_at: string | null;
}

interface OrderDocumentsProps {
    quoteId: number;
    /** Auth user id of the current shipper. Documents are stamped with it. */
    userId?: string | null;
    className?: string;
    /** Compact styling for use inside dense expanded rows. */
    compact?: boolean;
}

const BUCKET = 'documents';

/**
 * Upload + list documents attached to a single order (shippingquotes row).
 * Files live in the existing `documents` storage bucket under orders/<id>/,
 * and rows are stamped with quote_id (added in migration 010).
 */
const OrderDocuments: React.FC<OrderDocumentsProps> = ({
    quoteId,
    userId,
    className = '',
    compact = false,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [docs, setDocs] = useState<OrderDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        // quote_id column added in migration 010; cast until types regenerate.
        const { data, error: fetchError } = await (supabase.from('documents') as any)
            .select('id, title, file_name, file_type, file_url, created_at')
            .eq('quote_id', quoteId)
            .order('created_at', { ascending: false });

        if (fetchError) {
            setError('Could not load documents');
        } else {
            setError('');
            setDocs((data as OrderDocument[]) || []);
        }
        setLoading(false);
    }, [supabase, quoteId]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setError('');

        try {
            for (const file of Array.from(files)) {
                const ext = file.name.split('.').pop();
                const path = `orders/${quoteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET)
                    .upload(path, file, { upsert: false });
                if (uploadError) throw new Error(uploadError.message);

                const { error: insertError } = await (supabase.from('documents') as any).insert({
                    quote_id: quoteId,
                    user_id: userId ?? null,
                    title: file.name,
                    file_name: file.name,
                    file_type: file.type,
                    file_url: path,
                });
                if (insertError) throw new Error(insertError.message);
            }
            await fetchDocs();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDownload = async (doc: OrderDocument) => {
        if (!doc.file_url) return;
        setBusyId(doc.id);
        try {
            const { data, error: urlError } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(doc.file_url, 60);
            if (urlError || !data?.signedUrl) throw new Error(urlError?.message || 'Could not open file');
            window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not open file');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (doc: OrderDocument) => {
        setBusyId(doc.id);
        setError('');
        try {
            if (doc.file_url) {
                await supabase.storage.from(BUCKET).remove([doc.file_url]);
            }
            const { error: delError } = await supabase.from('documents').delete().eq('id', doc.id);
            if (delError) throw new Error(delError.message);
            setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className={className}>
            <div className="mb-3 flex items-center justify-between">
                <h4 className={`flex items-center gap-2 font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                    <Paperclip className={`text-blue-600 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    Order Documents
                </h4>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {error && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading documents…
                </div>
            ) : docs.length === 0 ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                >
                    <FileText className="h-7 w-7 text-gray-300" />
                    <p className="text-xs font-medium text-gray-600">No documents yet</p>
                    <p className="text-[11px] text-gray-400">
                        Attach the BOL, invoice, photos, or any paperwork for this order.
                    </p>
                </button>
            ) : (
                <ul className="space-y-2">
                    {docs.map((doc) => (
                        <li
                            key={doc.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                <span className="truncate text-xs font-medium text-gray-800" title={doc.file_name || ''}>
                                    {doc.title || doc.file_name || 'Document'}
                                </span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleDownload(doc)}
                                    disabled={busyId === doc.id}
                                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600 disabled:opacity-50"
                                    title="Download"
                                >
                                    {busyId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(doc)}
                                    disabled={busyId === doc.id}
                                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OrderDocuments;
