import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

interface FreightFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    editingFreight: boolean;
    selectedOption: string;
    handleOptionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    yearAmount: string;
    setYearAmount: (value: string) => void;
    make: string;
    setMake: (value: string) => void;
    model: string;
    setModel: (value: string) => void;
    palletCount: string;
    setPalletCount: (value: string) => void;
    commodity: string;
    setCommodity: (value: string) => void;
    length: string;
    setLength: (value: string) => void;
    lengthUnit: string;
    setLengthUnit: (value: string) => void;
    width: string;
    setWidth: (value: string) => void;
    widthUnit: string;
    setWidthUnit: (value: string) => void;
    height: string;
    setHeight: (value: string) => void;
    heightUnit: string;
    setHeightUnit: (value: string) => void;
    weight: string;
    setWeight: (value: string) => void;
    weightUnit: string;
    setWeightUnit: (value: string) => void;
    serialNumber: string;
    setSerialNumber: (value: string) => void;
    inventoryNumber: string;
    setInventoryNumber: (value: string) => void;
    setErrorText: (value: string) => void;
}

const FreightFormModal: React.FC<FreightFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingFreight,
    selectedOption,
    handleOptionChange,
    yearAmount,
    setYearAmount,
    make,
    setMake,
    model,
    setModel,
    palletCount,
    setPalletCount,
    commodity,
    setCommodity,
    length,
    setLength,
    lengthUnit,
    setLengthUnit,
    width,
    setWidth,
    widthUnit,
    setWidthUnit,
    height,
    setHeight,
    heightUnit,
    setHeightUnit,
    weight,
    setWeight,
    weightUnit,
    setWeightUnit,
    serialNumber,
    setSerialNumber,
    inventoryNumber,
    setInventoryNumber,
    setErrorText,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 dark:text-zinc-100 z-50 h-full bg-opacity-50 flex justify-center items-center">
            <div className="dark:text-zinc-100 dark:bg-zinc-900 border border-zinc-700 shadow-lg bg-zinc-100 z-50 p-4 md:p-8 h-192.5 max-h-max my-16 rounded w-full md:w-1/2 overflow-y-auto">
                <h2 className="text-xl dark:text-zinc-100 mb-4">{editingFreight ? 'Edit Inventory' : 'Add Inventory'}</h2>
                <form onSubmit={onSubmit} className="flex flex-col w-full gap-2 my-2 p-2 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100">
                    <div className='flex flex-col gap-4 w-full dark:bg-zinc-900 dark:text-zinc-100'>
                        <label className='text-zinc-900 font-medium dark:text-zinc-100'>Inventory Type
                            <select
                                className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                value={selectedOption}
                                onChange={handleOptionChange}
                            >
                                <option value="">Select...</option>
                                <option value="equipment">Equipment/Machinery</option>
                                <option value="containers">Containers</option>
                                <option value="semi_trucks">Semi Trucks</option>
                                <option value="ltl_ftl">LTL/FTL</option>
                                <option value="auto">Auto</option>
                                <option value="rv_trailers">RV Trailers</option>
                                <option value="boats">Boats</option>
                            </select>
                        </label>

                        {selectedOption === 'equipment' && (
                            <div className='md:flex gap-2 w-full'>
                                <label className='dark:text-zinc-100 font-medium'>Year
                                    <input
                                        className="rounded w-full p-2 border border-zinc-900"
                                        type="text"
                                        placeholder='Year'
                                        value={yearAmount}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setYearAmount(e.target.value);
                                        }}
                                    />
                                </label>
                                <label className='dark:text-zinc-100 font-medium'>Make
                                    <input
                                        className="rounded w-full p-2 border border-zinc-900"
                                        type="text"
                                        placeholder='Make'
                                        value={make}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setMake(e.target.value);
                                        }}
                                    />
                                </label>
                                <label className='dark:text-zinc-100 font-medium'>Model
                                    <input
                                        className="rounded w-full p-2 border border-zinc-900"
                                        type="text"
                                        placeholder='Model'
                                        value={model}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setModel(e.target.value);
                                        }}
                                    />
                                </label>
                            </div>
                        )}

                        {selectedOption === 'ltl_ftl' && (
                            <div className='flex gap-2 w-full'>
                                <label className='dark:text-zinc-100 font-medium'>Pallet/Crate Count
                                    <input
                                        className="rounded w-full p-2 border border-zinc-900"
                                        type="text"
                                        placeholder='Pallet/Crate Count'
                                        value={palletCount}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setPalletCount(e.target.value);
                                        }}
                                    />
                                </label>
                                <label className='dark:text-zinc-100 font-medium'>Commodity
                                    <input
                                        className="rounded w-full p-2 border border-zinc-900"
                                        type="text"
                                        value={commodity}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setCommodity(e.target.value);
                                        }}
                                    />
                                </label>
                            </div>
                        )}

                        <div className='md:flex gap-2'>
                            <label className='dark:text-zinc-100 font-medium'>Length
                                <input
                                    className="rounded w-full px-2 py-1 border border-zinc-900"
                                    type="text"
                                    value={length}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setLength(e.target.value);
                                    }}
                                />
                                {selectedOption !== 'ltl_ftl' && (
                                    <select
                                        className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                        value={lengthUnit}
                                        onChange={(e) => setLengthUnit(e.target.value)}
                                    >
                                        <option value="ft">Feet</option>
                                        <option value="in">Inches</option>
                                    </select>
                                )}
                            </label>
                            <label className='dark:text-zinc-100 font-medium'>Width
                                <input
                                    className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                    type="text"
                                    value={width}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWidth(e.target.value);
                                    }}
                                />
                                {selectedOption !== 'ltl_ftl' && (
                                    <select
                                        className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                        value={widthUnit}
                                        onChange={(e) => setWidthUnit(e.target.value)}
                                    >
                                        <option value="ft">Feet</option>
                                        <option value="in">Inches</option>
                                    </select>
                                )}
                            </label>
                            <label className='dark:text-zinc-100 font-medium'>Height
                                <input
                                    className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                    type="text"
                                    value={height}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setHeight(e.target.value);
                                    }}
                                />
                                {selectedOption !== 'ltl_ftl' && (
                                    <select
                                        className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900"
                                        value={heightUnit}
                                        onChange={(e) => setHeightUnit(e.target.value)}
                                    >
                                        <option value="ft">Feet</option>
                                        <option value="in">Inches</option>
                                    </select>
                                )}
                            </label>
                            <label className='dark:text-zinc-100 font-medium'>Weight
                                <input
                                    className="rounded w-full px-2 py-1 border text-zinc-900 border-zinc-900"
                                    type="text"
                                    value={weight}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWeight(e.target.value);
                                    }}
                                />
                                <select
                                    className="rounded w-full px-2 py-1 text-zinc-900 border border-zinc-900"
                                    value={weightUnit}
                                    onChange={(e) => setWeightUnit(e.target.value)}
                                >
                                    <option value="lbs">Pounds</option>
                                    <option value="T">Tons</option>
                                </select>
                            </label>
                        </div>
                        <div className='flex gap-2 justify-center mb-2 w-full'>
                            <label className='dark:text-zinc-100 w-full font-medium'>Serial Number
                                <input
                                    className="rounded text-zinc-900 w-full p-2 border border-zinc-900"
                                    type="text"
                                    value={serialNumber}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setSerialNumber(e.target.value);
                                    }}
                                />
                            </label>
                            <label className='dark:text-zinc-100 w-full font-medium'>Inventory Number
                                <input
                                    className="rounded w-full p-2 border border-zinc-900"
                                    type="text"
                                    value={inventoryNumber}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setInventoryNumber(e.target.value);
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <button className="body-btn" type="submit">
                        {editingFreight ? 'Update Inventory' : 'Add Inventory'}
                    </button>
                    {editingFreight && (
                        <button type="button" className="btn-slate mt-2 shadow-md hover:bg-stone-300/50 hover:text-zinc-700" onClick={onClose}>
                            Close
                        </button>
                    )}
                    <button type="button" className="bg-stone-300 text-zinc-800 py-2 px-4 font-semibold mt-2 hover:bg-stone-300/50 hover:text-zinc-700" onClick={onClose}>
                        Close
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FreightFormModal;