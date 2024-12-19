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
    const [items, setItems] = useState([{ year: '', make: '', model: '', vin: '', operationalCondition: null, isAuction: null, auction: '', buyerNumber: '', lotNumber: '' }]);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);

    useEffect(() => {
        setFormData(items);
    }, [items]);

    useEffect(() => {
        // Fetch all makes
        axios.get('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json')
            .then(response => {
                setMakes(response.data.Results);
            })
            .catch(error => {
                console.error('Error fetching makes:', error);
            });
    }, []);

    useEffect(() => {
        if (items.some(item => item.make)) {
            // Fetch models for the selected make
            const fetchModels = async () => {
                const make = items.find(item => item.make)?.make;
                if (make) {
                    const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${make}?format=json`);
                    setModels(response.data.Results);
                }
            };
            fetchModels();
        }
    }, [items]);

    const handleAddItem = () => {
        setItems([...items, { year: '', make: '', model: '', vin: '', operationalCondition: null, isAuction: null, auction: '', buyerNumber: '', lotNumber: '' }]);
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

    return (
        <div className="flex flex-col gap-3">
            {items.map((item, index) => (
                <div key={index} className="border p-3 rounded mb-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Shipment Item #{index + 1}</h3>
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
                    <div>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="text"
                            value={item.year}
                            onChange={(e) => { handleChange(index, 'year', e.target.value); setErrorText(''); }}
                        />
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make</label>
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            value={item.make}
                            onChange={(e) => { handleChange(index, 'make', e.target.value); setErrorText(''); }}
                        >
                            <option value="">Select Make</option>
                            {makes.map((make) => (
                                <option key={make.Make_ID} value={make.Make_Name}>
                                    {make.Make_Name}
                                </option>
                            ))}
                        </select>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model</label>
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            value={item.model}
                            onChange={(e) => { handleChange(index, 'model', e.target.value); setErrorText(''); }}
                        >
                            <option value="">Select Model</option>
                            {models.map((model) => (
                                <option key={model.Model_ID} value={model.Model_Name}>
                                    {model.Model_Name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>VIN #</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            placeholder='optional'
                            type="text"
                            value={item.vin}
                            onChange={(e) => { handleChange(index, 'vin', e.target.value); setErrorText(''); }}
                        />
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Operational Condition</label>
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            value={item.operationalCondition || ''}
                            onChange={(e) => handleChange(index, 'operationalCondition', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="operable">Operable</option>
                            <option value="inoperable">Inoperable</option>
                        </select>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Is Auction
                            <select
                                className='block'
                                value={item.isAuction === null ? '' : item.isAuction ? 'yes' : 'no'}
                                onChange={(e) => {
                                    setErrorText('');
                                    handleChange(index, 'isAuction', e.target.value === 'yes');
                                }}
                            >
                                <option value="">Select...</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </label>
                    </div>
                </div>
            ))}
            <button
                type="button"
                className="body-btn mt-2 w-1/3"
                onClick={handleAddItem}
            >
                Add Item
            </button>
        </div>
    );
};

export default AutoForm;