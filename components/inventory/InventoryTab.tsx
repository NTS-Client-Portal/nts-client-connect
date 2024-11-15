import React, { useState } from 'react';
import { Database } from '@/lib/database.types';
import { fetchFreightData, addFreightItem } from '@/lib/database';

interface InventoryTabProps {
    freightList: Database['public']['Tables']['freight']['Row'][];
    editFreight: (freight: Database['public']['Tables']['freight']['Row']) => void;
    handleDeleteClick: (id: number) => void;
    handleAddFreight: (freight: Database['public']['Tables']['freight']['Row']) => void; // Add this prop
}

const InventoryTab = ({ freightList = [], editFreight, handleDeleteClick, handleAddFreight }: InventoryTabProps) => {
    const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
    const [selectedFreight, setSelectedFreight] = useState<Database['public']['Tables']['freight']['Row'] | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null); // Add error state

    const openTransferModal = (freight: Database['public']['Tables']['freight']['Row']) => {
        setSelectedFreight(freight);
        setIsTransferModalOpen(true);
    };

    

    return (
        <div className="w-full bg-white dark:bg-zinc-700 shadow rounded-md border border-zinc-400 max-h-max flex-grow">
            {error && <div className="text-red-500 p-4">{error}</div>} {/* Display error message */}
            <div className="hidden xl:block parent-container overflow-x-auto ">
                <table className="min-w-full divide-y  divide-zinc-200">
                    <thead className="bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-900">
                        <tr className='border-b dark:text-zinc-50 border-zinc-900/20  dark:border-zinc-900'>
                            <th className="dark:border-zinc-900 px-6 py-1 text-left text-nowrap text-xs font-normal dark:text-normal dark:font-medium uppercase tracking-wider border-r border-zinc-900/20  dark:border-zinc-100/20 ">Inventory Item</th>
                            <th className="dark:border-zinc-900 px-6 py-1 text-left text-nowrap text-xs font-normal dark:text-normal dark:font-medium uppercase tracking-wider border-r border-zinc-900/20  dark:border-zinc-100/20 ">Dimensions</th>
                            <th className="dark:border-zinc-900 px-6 py-1 text-left text-nowrap text-xs font-normal dark:text-normal dark:font-medium uppercase tracking-wider border-r border-zinc-900/20  dark:border-zinc-100/20 ">Serial Number</th>
                            <th className="dark:border-zinc-900 px-6 py-1 text-left text-nowrap text-xs font-normal dark:text-normal dark:font-medium uppercase tracking-wider border-r border-zinc-900/20  dark:border-zinc-100/20 ">Inventory Number</th>
                            <th className="dark:border-zinc-900 px-6 py-1  text-center text-nowrap text-xs font-normal dark:text-normal dark:font-medium uppercase tracking-tighter border-r border-zinc-900/20  dark:border-zinc-100/20">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800 dark:text-white divide-y divide-zinc-200 dark:divide-stone-100/20">
                        {freightList.map((freight) => (
                            <tr key={freight.id}>
                                <td className=" px-6 py-1 text-xs whitespace-nowrap border-r border-zinc-900/20  dark:border-zinc-100/20   dark:text-white">
                                    {freight.freight_type === 'ltl_ftl' ? freight.commodity : `${freight.year} ${freight.make} ${freight.model}`}
                                </td>
                                <td className=" px-6 py-1 text-xs whitespace-nowrap border-r border-zinc-900/20  dark:border-zinc-100/20   dark:text-white">
                                    {freight.length} {freight.length_unit}, {freight.width} {freight.width_unit}, {freight.height} {freight.height_unit}, {freight.weight} {freight.weight_unit}
                                </td>
                                <td className=" px-6 py-1 text-xs whitespace-nowrap border-r border-zinc-900/20  dark:border-zinc-100/20   dark:text-white">
                                    {freight.serial_number}
                                </td>
                                <td className=" px-6 py-1 text-xs whitespace-nowrap border-r border-zinc-900/20  dark:border-zinc-100/20   dark:text-white">
                                    {freight.inventory_number}
                                </td>
                                <td className="px-2 py-1 text-xs whitespace-nowrap flex justify-evenly items-center relative">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDropdownId(openDropdownId === freight.id ? null : freight.id)}
                                            className="text-blue-500 font-bold dark:text-blue-200"
                                        >
                                            Actions
                                        </button>
                                        {openDropdownId === freight.id && (
                                            <div className="absolute z-30 top-2 right-0 text-xs mt-2 w-48 bg-white border border-zinc-200 rounded shadow-lg">
                                                <button
                                                    onClick={() => {
                                                        editFreight(freight);
                                                        setOpenDropdownId(null);
                                                    }}
                                                    className="block w-full text-left px-4 py-2 font-bold text-sm text-blue-500 hover:bg-zinc-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDeleteClick(freight.id);
                                                        setOpenDropdownId(null);
                                                    }}
                                                    className="block w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-zinc-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block xl:hidden">
                {freightList.map((freight) => (
                    <div key={freight.id} className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Inventory Number</div>
                            <div className="text-sm font-normal text-nowrap text-zinc-900">{freight.inventory_number}</div>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Inventory Item</div>
                            <div className="text-sm font-normal text-nowrap dark:text-zinc-900">{freight.freight_type === 'ltl_ftl' ? freight.commodity : `${freight.year} ${freight.make} ${freight.model}`}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Dimensions</div>
                            <div className="text-sm font-normal text-nowrap text-zinc-900">{freight.length} {freight.length_unit}, {freight.width} {freight.width_unit}, {freight.height} {freight.height_unit}, {freight.weight} {freight.weight_unit}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500 dark:text-white">Serial Number</div>
                            <div className="text-sm font-normal text-nowrap text-zinc-900">{freight.serial_number}</div>
                        </div>
                        <div className="block justify-between items-center md:flex md:flex-col ">
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdownId(openDropdownId === freight.id ? null : freight.id)}
                                    className="text-blue-500 mr-4"
                                >
                                    Actions
                                </button>
                                {openDropdownId === freight.id && (
                                    <div className="absolute z-0 right-0 mt-2 w-48 bg-white border border-zinc-200 rounded shadow-lg">
                                        <button
                                            onClick={() => {
                                                editFreight(freight);
                                                setOpenDropdownId(null);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-zinc-100"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDeleteClick(freight.id);
                                                setOpenDropdownId(null);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-zinc-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryTab;