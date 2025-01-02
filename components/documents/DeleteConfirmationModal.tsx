import React from 'react';

const DeleteConfirmationModal = ({ isModalOpen, setIsModalOpen, handleDelete }) => {
    return (
        isModalOpen && (
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
        )
    );
};

export default DeleteConfirmationModal;