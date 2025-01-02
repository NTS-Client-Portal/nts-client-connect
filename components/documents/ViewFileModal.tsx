import React from 'react';

const ViewFileModal = ({ viewFileUrl, setViewFileUrl }) => {
    return (
        viewFileUrl && (
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
        )
    );
};

export default ViewFileModal;