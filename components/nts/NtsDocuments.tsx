import React, { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { Menu, Upload, Search, Grid3x3, List, FileText, Calendar, Download, Eye, X, AlertTriangle, Folder, FolderHeart, Star, Trash2 } from 'lucide-react';
import { updateFavoriteStatus } from '@/lib/database';
import { useDocumentNotification } from '@/context/DocumentNotificationContext';
import { formatDate } from '../user/quotetabs/QuoteUtils';

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
    const [activeSection, setActiveSection] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
    const [isNtsUser, setIsNtsUser] = useState(false);
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);
    const [viewFileContent, setViewFileContent] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const itemsPerPage = 12;

    const { setNewDocumentAdded } = useDocumentNotification();

    const fetchDocuments = useCallback(async () => {
        if (!session) return;

        setLoading(true);
        try {
            // Fetch regular documents
            const { data: docsData, error: docsError } = await supabase
                .from("documents")
                .select("*")
                .eq("nts_user_id", session.user.id)
                .order("created_at", { ascending: sortOrder === "asc" });

            if (docsError) {
                setError(docsError.message);
            } else {
                setDocuments(docsData);
                setImportantDocuments(docsData.filter((doc) => doc.is_favorite));
            }

            // Fetch NTS storage documents
            const { data: storageData, error: storageError } = await supabase
                .storage
                .from('nts-documents')
                .list('', { limit: 100 });

            if (storageError) {
                setError(storageError.message);
            } else {
                setNtsDocuments(storageData || []);
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, [session, supabase, sortOrder]);

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
        fetchDocuments();
    }, [session, fetchDocuments, supabase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !session || !title.trim()) return;

        setUploading(true);
        try {
            const filePath = await uploadFileToSupabase(file, session.user.id);
            const documentData = await saveDocumentMetadata(session.user.id, file.name, filePath, title, description);
            
            setTitle('');
            setDescription('');
            setFile(null);
            setShowUploadModal(false);
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

            setNewDocumentAdded(true);
        } catch (error) {
            console.error('Error uploading document:', error);
            setError(error.message);
        } finally {
            setUploading(false);
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

    const filteredDocuments = (docs: Database["public"]["Tables"]["documents"]["Row"][]) => {
        return docs.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const renderDocuments = (docs: Database["public"]["Tables"]["documents"]["Row"][]) => {
        const filtered = filteredDocuments(docs);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDocs = filtered.slice(startIndex, endIndex);

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedDocs.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleFavoriteToggle(doc.id, !doc.is_favorite)}
                                            className="p-1 hover:bg-slate-100 rounded"
                                        >
                                            <Star className={`w-4 h-4 ${doc.is_favorite ? 'text-yellow-500 fill-current' : 'text-slate-400'}`} />
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(doc.id)}
                                            className="p-1 hover:bg-slate-100 rounded"
                                        >
                                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                                    {doc.title}
                                </h3>
                                
                                {doc.description && (
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                        {doc.description}
                                    </p>
                                )}
                                
                                <div className="flex items-center text-xs text-slate-500 mb-4">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(doc.created_at)}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleView(doc.file_url)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                    >
                                        <Eye className="w-3 h-3" />
                                        View
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(doc.file_url, doc.file_name)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else {
            return (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-200">
                        {paginatedDocs.map((doc) => (
                            <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                                            {doc.description && (
                                                <p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                                            )}
                                            <div className="flex items-center text-xs text-slate-500 mt-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(doc.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleFavoriteToggle(doc.id, !doc.is_favorite)}
                                            className="p-2 hover:bg-slate-100 rounded"
                                        >
                                            <Star className={`w-4 h-4 ${doc.is_favorite ? 'text-yellow-500 fill-current' : 'text-slate-400'}`} />
                                        </button>
                                        <button 
                                            onClick={() => handleView(doc.file_url)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                        <button 
                                            onClick={() => handleDownload(doc.file_url, doc.file_name)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(doc.id)}
                                            className="p-2 hover:bg-slate-100 rounded"
                                        >
                                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };

    const renderNtsDocuments = (docs: any[]) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDocs = docs.slice(startIndex, endIndex);

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedDocs.map((doc) => (
                        <div key={doc.name} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                                
                                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                                    {doc.name}
                                </h3>
                                
                                <div className="flex items-center text-xs text-slate-500 mb-4">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(doc.created_at)}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleView(doc.name)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                    >
                                        <Eye className="w-3 h-3" />
                                        View
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(doc.name, doc.name)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else {
            return (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-200">
                        {paginatedDocs.map((doc) => (
                            <div key={doc.name} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                                            <div className="flex items-center text-xs text-slate-500 mt-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(doc.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleView(doc.name)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                        <button 
                                            onClick={() => handleDownload(doc.name, doc.name)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const sections = [
        { id: 'all', label: 'All Documents', icon: Folder, count: documents.length },
        { id: 'important', label: 'Favorites', icon: FolderHeart, count: importantDocuments.length },
        { id: 'nts-documents', label: 'NTS Storage', icon: Folder, count: ntsDocuments.length }
    ];

    const getCurrentDocs = () => {
        if (activeSection === 'all') return documents;
        if (activeSection === 'important') return importantDocuments;
        return []; // NTS documents are handled separately
    };

    const currentDocs = getCurrentDocs();
    const filteredCount = activeSection === 'nts-documents' ? ntsDocuments.length : filteredDocuments(currentDocs).length;
    const totalPages = Math.ceil(filteredCount / itemsPerPage);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">NTS Documents</h1>
                        <p className="text-sm text-slate-600">{filteredCount} documents</p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto lg:flex lg:gap-8 lg:p-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 lg:flex-shrink-0">
                    <div className="lg:sticky lg:top-8">
                        {/* Desktop Header */}
                        <div className="hidden lg:block mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">NTS Documents</h1>
                            <p className="text-slate-600 mt-2">Manage your files and documents</p>
                        </div>

                        {/* Mobile Section Selector */}
                        <div className="lg:hidden bg-white border-b border-slate-200">
                            <div className="flex">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                            activeSection === section.id
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {section.label}
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                                            {section.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:block space-y-1 mb-8">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            activeSection === section.id
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {section.label}
                                        <span className="ml-auto px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                                            {section.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Desktop Upload Button */}
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="hidden lg:flex items-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Upload className="w-5 h-5" />
                            Upload Document
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 lg:max-w-5xl">
                    {/* Controls Bar */}
                    <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 sm:flex-none sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'grid' 
                                            ? 'bg-blue-100 text-blue-600' 
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Grid3x3 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'list' 
                                            ? 'bg-blue-100 text-blue-600' 
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Documents Grid/List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-600">Loading documents...</p>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'nts-documents' ? (
                                ntsDocuments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">No NTS documents found</h3>
                                        <p className="text-slate-600 mb-6">Upload documents to get started</p>
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            <Upload className="w-5 h-5" />
                                            Upload Document
                                        </button>
                                    </div>
                                ) : (
                                    renderNtsDocuments(ntsDocuments)
                                )
                            ) : (
                                filteredDocuments(currentDocs).length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                                            {searchTerm ? 'No documents found' : 'No documents yet'}
                                        </h3>
                                        <p className="text-slate-600 mb-6">
                                            {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
                                        </p>
                                        {!searchTerm && (
                                            <button
                                                onClick={() => setShowUploadModal(true)}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                <Upload className="w-5 h-5" />
                                                Upload Document
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    renderDocuments(currentDocs)
                                )
                            )}
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-8">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-slate-700">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Document Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter document title"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Optional description"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    File *
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {file && (
                                    <p className="text-sm text-slate-600 mt-1">
                                        Selected: {file.name}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !file || !title.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">Delete Document</h3>
                                    <p className="text-sm text-slate-600">This action cannot be undone</p>
                                </div>
                            </div>
                            
                            <p className="text-slate-700 mb-6">
                                Are you sure you want to delete this document? It will be permanently removed from your account.
                            </p>
                            
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View File Modal */}
            {viewFileUrl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Document Preview</h2>
                            <button
                                onClick={() => setViewFileUrl(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <iframe 
                                src={viewFileUrl} 
                                className="w-full h-96 border border-slate-200 rounded-lg" 
                                title="Document Preview"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* View File Content Modal */}
            {viewFileContent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Document Preview</h2>
                            <button
                                onClick={() => setViewFileContent(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div dangerouslySetInnerHTML={{ __html: viewFileContent }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NtsDocuments;