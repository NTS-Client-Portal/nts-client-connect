import React, { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { Menu, Upload } from 'lucide-react';
import { updateFavoriteStatus } from '@/lib/database';
import { useDocumentNotification } from '@/context/DocumentNotificationContext';
import DocumentCard from '@components/documents/DocumentCard';
import NtsSidebar from '@components/documents/NtsSidebar';
import Pagination from '@components/documents/Pagination';
import DeleteConfirmationModal from '@components/documents/DeleteConfirmationModal';
import { Star, Trash2, Download, Eye } from 'lucide-react';

interface DocumentsProps {
    session: Session | null;
}

const NtsDocuments: React.FC<DocumentsProps> = ({ session }) => {
    const supabase = useSupabaseClient<Database>();
    const [documents, setDocuments] = useState<Database['public']['Tables']['documents']['Row'][]>([]);
    const [importantDocuments, setImportantDocuments] = useState<Database['public']['Tables']['documents']['Row'][]>([]);
    const [ntsDocuments, setNtsDocuments] = useState<any[]>([]);
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
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null); // State to store the file URL for viewing
    const [currentPage, setCurrentPage] = useState(1); // State to control pagination
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // State to control sort order
    const itemsPerPage = 15; // Number of items per page for desktop

    const { setNewDocumentAdded } = useDocumentNotification();

    const fetchNtsDocuments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .storage
            .from('nts-documents')
            .list('', { limit: 100 });

        if (error) {
            setError(error.message);
        } else {
            setNtsDocuments(data);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        const checkNtsUser = async () => {
            if (session?.user?.id) {
                const { data, error } = await supabase
                    .from('nts_users')
                    .select('id')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (data) {
                    setIsNtsUser(true);
                }
            }
        };

        checkNtsUser();
        fetchNtsDocuments();
    }, [session, fetchNtsDocuments, supabase]); // Include 'supabase' in the dependency array

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
            fetchNtsDocuments();

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

            // Set the notification state
            setNewDocumentAdded(true);
        } catch (error) {
            setError(error.message);
        }
    };

    const uploadFileToSupabase = async (file: File, userId: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
            .from('nts-documents')
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
                nts_user_id: userId,
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
            fetchNtsDocuments();
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
            fetchNtsDocuments();
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
            .from('nts-documents')
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

    const handleView = async (fileUrl: string) => {
        const { data, error } = await supabase.storage
            .from('nts-documents')
            .download(fileUrl);

        if (error) {
            setError(error.message);
            return;
        }

        const url = window.URL.createObjectURL(data);
        setViewFileUrl(url);
    };

    const renderDocuments = (docs: Database['public']['Tables']['documents']['Row'][]) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDocs = docs.slice(startIndex, endIndex);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedDocs.map((doc) => (
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
                        <div className="flex gap-2">
                            <button onClick={() => handleDownload(doc.file_url, doc.title)} className="btn-blue">
                                Download
                            </button>
                            <button onClick={() => handleView(doc.file_url)} className="btn-blue">
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderNtsDocuments = (docs: any[]) => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                    <DocumentCard
                        key={doc.name}
                        doc={{
                            id: doc.name,
                            title: doc.name,
                            description: '',
                            file_url: `${doc.name}`,
                            is_favorite: false,
                        }}
                        handleFavoriteToggle={handleFavoriteToggle}
                        openDeleteModal={openDeleteModal}
                        handleView={handleView}
                        handleDownload={handleDownload}
                    />
                ))}
            </div>
        );
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = Math.ceil(documents.length / itemsPerPage);

    return (
        <div className="flex h-screen">
            <NtsSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />

            <div className="flex-1 p-4 ml-0">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-4">
                    <h1 className="text-2xl text-nowrap font-bold">
                        {activeSection === 'all' && 'All Documents'}
                        {activeSection === 'important' && 'Important'}
                        {activeSection === 'nts-documents' && 'NTS Documents'}
                    </h1>
                    <div className="md:hidden flex justify-between md:justify-normal gap-2">
                        <button className="text-NtsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm mt-1" onClick={handleUpload}>
                            <Upload className='h-4' /> Upload Documents</button>
                        <button className="md:hidden bg-zinc-700 text-white shadow-md p-2 rounded-md" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full mb-2">
                    <div className="">
                        <label className="mr-2">Sort by:</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="rounded p-1 bg-white border shadow-md"
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            handlePageChange={handlePageChange}
                        />
                    )}

                    <button className="text-ntsBlue border shadow-sm px-2 py-2 rounded-md flex items-center justify-start gap-1 font-semibold text-sm mt-1" onClick={handleUpload}>
                        <Upload className='h-4' /> Upload Documents</button>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : activeSection === 'all' ? (
                    renderDocuments(documents)
                ) : activeSection === 'important' ? (
                    renderDocuments(importantDocuments)
                ) : (
                    renderNtsDocuments(ntsDocuments)
                )}
            </div>
             {viewFileUrl && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="fixed inset-0 bg-black opacity-50"></div>
                    <div className="bg-white rounded-lg shadow-lg p-6 z-50 max-w-3xl w-full">
                        <h2 className="text-xl font-bold mb-4">View Document</h2>
                        <div className="mb-4">
                            <iframe src={viewFileUrl} className="w-full h-96" />
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="bg-zinc-300 text-zinc-700 px-4 py-2 rounded"
                                onClick={() => setViewFileUrl(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <DeleteConfirmationModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                handleDelete={handleDelete} />
        </div>
    );
}

export default NtsDocuments;