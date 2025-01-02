import React from 'react';

const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
    return (
        <div className='flex justify-center'>
            {Array.from({ length: totalPages }, (_, index) => (
                <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-4 py-2 mx-1 mt-4 mb-8 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                    {index + 1}
                </button>
            ))}
        </div>
    );
};

export default Pagination;