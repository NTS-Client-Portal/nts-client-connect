import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AutoFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const AutoForm: React.FC<AutoFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [items, setItems] = useState([{ year: '', make: '', model: '', vin: '', operationalCondition: null, isAuction: null, auction: '', buyerNumber: '', lotNumber: '', goods_value: '' }]);
    const [models, setModels] = useState<{ Model_ID: string; Model_Name: string }[]>([]);
    const [filteredMakes, setFilteredMakes] = useState<string[]>([]);
    const [filteredModels, setFilteredModels] = useState<{ Model_ID: string; Model_Name: string }[]>([]);
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

    const mainAutoBrands = [
        'Volvo', 'Volkswagen', 'Ford', 'BMW', 'Mercedes', 'Hyundai', 'Toyota', 'Tesla', 'Honda', 'Chevrolet', 'Kia', 'Suzuki', 'Buick', 'Audi'
    ];

    useEffect(() => {
        setFormData(items);
    }, [items, setFormData]);

    useEffect(() => {
        if (items.some(item => item.make)) {
            // Fetch models for the selected make
            const fetchModels = async () => {
                const make = items.find(item => item.make)?.make;
                if (make) {
                    try {
                        const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${make}?format=json`);
                        setModels(response.data.Results);
                    } catch (error) {
                        console.error('Error fetching models:', error);
                        setModels([]);
                    }
                }
            };
            fetchModels();
        }
    }, [items]);

    const handleAddItem = () => {
        setItems([...items, { year: '', make: '', model: '', vin: '', operationalCondition: null, isAuction: null, auction: '', buyerNumber: '', lotNumber: '', goods_value: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleMakeInputChange = (index: number, value: string) => {
        handleChange(index, 'make', value);
        setFilteredMakes(mainAutoBrands.filter(make => make.toLowerCase().includes(value.toLowerCase())));
        setShowMakeDropdown(true);
        setHighlightedIndex(null);
    };

    const handleModelInputChange = (index: number, value: string) => {
        handleChange(index, 'model', value);
        setFilteredModels(models.filter(model => model.Model_Name.toLowerCase().includes(value.toLowerCase())));
        setShowModelDropdown(true);
        setHighlightedIndex(null);
    };

    const handleMakeSelect = (index: number, make: string) => {
        handleChange(index, 'make', make);
        setShowMakeDropdown(false);
    };

    const handleModelSelect = (index: number, model: string) => {
        handleChange(index, 'model', model);
        setShowModelDropdown(false);
    };

    const handleValueSelect = (index: number, value: string) => {
        handleChange(index, 'value', value);
        setShowModelDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number, type: 'make' | 'model') => {
        const options = type === 'make' ? filteredMakes : filteredModels.map(model => model.Model_Name);
        if (e.key === 'ArrowDown') {
            setHighlightedIndex(prevIndex => (prevIndex === null || prevIndex === options.length - 1 ? 0 : prevIndex + 1));
        } else if (e.key === 'ArrowUp') {
            setHighlightedIndex(prevIndex => (prevIndex === null || prevIndex === 0 ? options.length - 1 : prevIndex - 1));
        } else if (e.key === 'Enter' && highlightedIndex !== null) {
            if (type === 'make') {
                handleMakeSelect(index, options[highlightedIndex]);
            } else {
                handleModelSelect(index, options[highlightedIndex]);
            }
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {items.map((item, index) => (
                <div key={index} className="border p-3 rounded-md shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium">Vehicle Description {index > 0 ? index + 1 : ''}</h3>
                        {index > 0 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <div className='flex flex-col md:flex-row gap-2'>
                        <div className="flex flex-col w-full md:w-1/4">
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year</label>
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='e.g. 2020'
                                value={item.year}
                                onChange={(e) => { handleChange(index, 'year', e.target.value); setErrorText(''); }}
                            />
                        </div>
                        <div className='flex flex-col w-full md:w-1/3 relative'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make</label>
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                value={item.make}
                                placeholder='Toyota'
                                onChange={(e) => { handleMakeInputChange(index, e.target.value); setErrorText(''); }}
                                onKeyDown={(e) => handleKeyDown(e, index, 'make')}
                            />
                            {showMakeDropdown && filteredMakes.length > 0 && (
                                <ul className="absolute z-10 bg-white border border-zinc-900/30 shadow-md w-full max-h-40 overflow-y-auto">
                                    {filteredMakes.map((make, i) => (
                                        <li
                                            key={make}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${highlightedIndex === i ? 'bg-gray-200' : ''}`}
                                            onClick={() => handleMakeSelect(index, make)}
                                        >
                                            {make}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className='flex flex-col w-full md:w-1/3 relative'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model</label>
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                value={item.model}
                                placeholder='RAV4'
                                onChange={(e) => { handleModelInputChange(index, e.target.value); setErrorText(''); }}
                                onKeyDown={(e) => handleKeyDown(e, index, 'model')}
                            />
                            {showModelDropdown && filteredModels.length > 0 && (
                                <ul className="absolute z-10 bg-white border border-zinc-900/30 shadow-md w-full max-h-40 overflow-y-auto">
                                    {filteredModels.map((model, i) => (
                                        <li
                                            key={model.Model_ID}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${highlightedIndex === i ? 'bg-gray-200' : ''}`}
                                            onClick={() => handleModelSelect(index, model.Model_Name)}
                                        >
                                            {model.Model_Name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row gap-2 mt-3'>
                        <div className='flex flex-col w-full md:w-1/4'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Vehicle Value</label>
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                value={item.goods_value}
                                placeholder='e.g. $20,000'
                                onChange={(e) => { handleChange(index, 'value', e.target.value); setErrorText(''); }}
                            />
                        </div>
                        <div className='flex flex-col w-full md:w-1/2'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>VIN #</label>
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                placeholder='optional'
                                type="text"
                                value={item.vin}
                                onChange={(e) => { handleChange(index, 'vin', e.target.value); setErrorText(''); }}
                            />
                        </div>
                        <div className='flex flex-col w-full md:w-1/4'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Vehicle Condition</label>
                            <select
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                value={item.operationalCondition || ''}
                                onChange={(e) => handleChange(index, 'operationalCondition', e.target.value)}
                            >
                                <option value="">Select...</option>
                                <option value="operable">Operable</option>
                                <option value="inoperable">Inoperable</option>
                            </select>
                        </div>
                        <div className='flex flex-col w-full md:w-1/3'>
                            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Auction/Dealer Pickup?</label>
                            <select
                                className='rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md'
                                value={item.isAuction === null ? '' : item.isAuction ? 'yes' : 'no'}
                                onChange={(e) => {
                                    setErrorText('');
                                    handleChange(index, 'isAuction', e.target.value === 'yes');
                                }}
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <button
                type="button"
                className="text-ntsLightBlue font-semibold underline text-start"
                onClick={handleAddItem}
            >
                Add Vehicle
            </button>
        </div>
    );
};

export default AutoForm;