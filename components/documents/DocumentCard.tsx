import React from 'react';
import { Star, Trash2, Download, Eye } from 'lucide-react';

const DocumentCard = ({ doc, handleFavoriteToggle, openDeleteModal, handleView, handleDownload }) => {
    return (
        <div className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md p-4 border border-zinc-400">
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
            <div className="flex justify-between items-start gap-2">
                <button onClick={() => handleView(doc.file_url)} className="text-ntsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm">
                    <Eye className='h-4 w-auto' /> View
                </button>
                <button onClick={() => handleDownload(doc.file_url, doc.file_name)} className="text-ntsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm">
                    <Download className='h-4 w-auto' />Download
                </button>
            </div>
        </div>
    );
};

export default DocumentCard;