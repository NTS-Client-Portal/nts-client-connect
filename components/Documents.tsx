import React, { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { FolderHeart, Folder, Menu, Star, Trash2 } from 'lucide-react';
import { updateFavoriteStatus } from '@/lib/database';

interface DocumentsProps {
    session: Session | null;
}

const Documents: React.FC<DocumentsProps> = ({ session }) => {
    const supabase = useSupabaseClient<Database>();
    const [documents, setDocuments] = useState<Database['public']['Tables']['documents']['Row'][]>([]);
    const [importantDocuments, setImportantDocuments] = useState<Database['public']['Tables']['documents']['Row'][]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [activeSection, setActiveSection] = useState('all'); // State to control active section
    const [sidebarOpen, setSidebarOpen] = useState(false); // State to control sidebar visibility
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [documentToDelete, setDocumentToDelete] = useState<number | null>(null); // State to store the document to be deleted
    const [isNtsUser, setIsNtsUser] = useState(false);

    const fetchDocuments = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .or(`user_id.eq.${session.user.id},nts_user_id.eq.${session.user.id}`); // Filtering documents by the authenticated user's ID or nts_user_id

        if (error) {
            setError(error.message);
        } else {
            setDocuments(data);
            setImportantDocuments(data.filter(doc => doc.is_favorite));
        }
        setLoading(false);
    }, [session, supabase]);

    useEffect(() => {
        const checkNtsUser = async () => {
            if (session?.user?.id) {
                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    setIsNtsUser(true);
                }
            }
        };

        checkNtsUser();
        fetchDocuments();
    }, [session, fetchDocuments, supabase]); // Include 'supabase' in the dependency array

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !session) return;

        try {
            const filePath = await uploadFileToSupabase(file, session.user.id);
            const documentData = await saveDocumentMetadata(session.user.id, file.name, filePath, title, description);
            setTitle('');
            setDescription('');
            setFile(null);
            fetchDocuments();

            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    user_id: session.user.id,
                    message: `A new document titled "${title}" has been uploaded.`,
                    document_id: documentData.id,
                });

            if (notificationError) {
                console.error('Error creating notification:', notificationError.message);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const uploadFileToSupabase = async (file: File, userId: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

        if (error) {
            throw new Error(error.message);
        }

        return data.path;
    };

    const saveDocumentMetadata = async (userId: string, fileName: string, filePath: string, title: string, description: string) => {
        const { data, error } = await supabase
            .from('documents')
            .insert({
                user_id: isNtsUser ? null : userId,
                nts_user_id: isNtsUser ? userId : null,
                title,
                description,
                file_name: fileName,
                file_type: file.type,
                file_url: filePath,
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    };

    const handleFavoriteToggle = async (documentId: number, isFavorite: boolean) => {
        const { data, error } = await updateFavoriteStatus(documentId, isFavorite);
        if (error) {
            setError(error.message);
        } else {
            fetchDocuments();
        }
    };

    const handleDelete = async () => {
        if (!documentToDelete) return;

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentToDelete);

        if (error) {
            setError(error.message);
        } else {
            fetchDocuments();
            setIsModalOpen(false);
            setDocumentToDelete(null);
        }
    };

    const openDeleteModal = (documentId: number) => {
        setDocumentToDelete(documentId);
        setIsModalOpen(true);
    };

    const handleDownload = async (fileUrl: string, fileName: string) => {
        const { data, error } = await supabase.storage
            .from('documents')
            .download(fileUrl);

        if (error) {
            setError(error.message);
            return;
        }

        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const renderDocuments = (docs: Database['public']['Tables']['documents']['Row'][]) => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                    <div key={doc.id} className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">{doc.title}</div>
                            <div className="flex items-center">
                                <button onClick={() => handleFavoriteToggle(doc.id, !doc.is_favorite)}>
                                    {doc.is_favorite ? <Star className="text-yellow-500" /> : <Star />}
                                </button>
                                <button onClick={() => openDeleteModal(doc.id)} className="ml-2">
                                    <Trash2 className="text-red-500" />
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-zinc-900 dark:text-white mb-2">{doc.description}</div>
                        <button onClick={() => handleDownload(doc.file_url, doc.file_name)} className="btn-blue">
                            Download
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'tranzinc-x-0' : '-tranzinc-x-full'} transition-transform duration-300 ease-in-out w-64 bg-zinc-200 dark:bg-zinc-900 dark:text-white p-4 border-r border-t border-zinc-700/20 shadow-lg z-50 md:relative md:tranzinc-x-0`}>
                <h2 className="text-xl font-bold mb-4">Documents</h2>
                <ul className="space-y-2">
                    <li className='flex gap-1 items-center'>
                        <Folder />
                        <button
                            className={`w-full text-left p-2 ${activeSection === 'all' ? 'bg-zinc-100 dark:text-zinc-800' : ''}`}
                            onClick={() => setActiveSection('all')}
                        >
                            All Documents
                        </button>
                    </li>
                    <li className='flex gap-1 items-center'>
                        <FolderHeart />
                        <button
                            className={`w-full text-left p-2 ${activeSection === 'important' ? 'bg-zinc-100 dark:text-zinc-800' : ''}`}
                            onClick={() => setActiveSection('important')}
                        >
                            Important
                        </button>
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 ml-0">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">
                        {activeSection === 'all' && 'All Documents'}
                        {activeSection === 'important' && 'Important'}
                    </h1>
                    <button className="btn-blue" onClick={handleUpload}>Upload Document</button>
                    <button className="md:hidden btn-blue" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {/* Upload Form */}
                {activeSection === 'all' && (
                    <>
                        <h2 className='font-semibold'>Upload Documents</h2>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="rounded w-full p-2 border border-zinc-900 mb-2"
                            />
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded w-full p-2 border border-zinc-900 mb-2"
                            />
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="rounded w-full p-2 border border-zinc-900"
                            />
                        </div>
                    </>
                )}

                {/* Documents List */}
                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : activeSection === 'all' ? (
                    documents.length === 0 ? (
                        <p>No documents found.</p>
                    ) : (
                        renderDocuments(documents)
                    )
                ) : activeSection === 'important' ? (
                    importantDocuments.length === 0 ? (
                        <p>No important documents found.</p>
                    ) : (
                        renderDocuments(importantDocuments)
                    )
                ) : null}
            </div>

            {/* Delete Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="fixed inset-0 bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-lg p-6 z-50">
                        <h2 className="text-xl font-bold mb-4">Delete Document</h2>
                        <p className="mb-4">Are you sure you want to delete this document?</p>
                        <div className="flex justify-end">
                            <button
                                className="bg-zinc-300 text-zinc-700 px-4 py-2 rounded mr-2"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-red-600 text-white px-4 py-2 rounded"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;