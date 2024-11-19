import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import Papa from 'papaparse';
import { Database } from '@lib/database.types';
import InventoryTab from '@/components/inventory/InventoryTab';
import { checkDuplicateInventoryNumber, addFreightItem } from '@lib/database';
import { Client } from 'pg';

interface FreightInventoryProps {
    session: Session | null;
}

type Freight = Database['public']['Tables']['freight']['Row'];

// Define the fetchFreightData function
async function fetchFreightData(userId: string): Promise<Freight[]> {
    const client = new Client();
    await client.connect();
    const res = await client.query<Freight>(`
    SELECT f.*
    FROM freight f
    JOIN profiles p ON f.user_id = p.user_id
    WHERE p.company_id = (
      SELECT company_id
      FROM profiles
      WHERE user_id = $1
    );
  `, [userId]);
    await client.end();
    return res.rows;
}

const FreightInventory = ({ session }: FreightInventoryProps) => {
    const supabase = useSupabaseClient<Database>();
    const [freightList, setFreightList] = useState<Freight[]>([]);
    const [selectedFreight, setSelectedFreight] = useState<Freight | null>(null);
    const [selectedOption, setSelectedOption] = useState<string>('equipment'); // Default to "equipment"
    const [yearAmount, setYearAmount] = useState<string>('');
    const [make, setMake] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [palletCount, setPalletCount] = useState<string>('');
    const [commodity, setCommodity] = useState<string>('');
    const [length, setLength] = useState<string>('');
    const [lengthUnit, setLengthUnit] = useState<string>('ft'); // Default to feet
    const [width, setWidth] = useState<string>('');
    const [widthUnit, setWidthUnit] = useState<string>('ft'); // Default to feet
    const [height, setHeight] = useState<string>('');
    const [heightUnit, setHeightUnit] = useState<string>('ft'); // Default to feet
    const [weight, setWeight] = useState<string>('');
    const [weightUnit, setWeightUnit] = useState<string>('lbs'); // Default to pounds
    const [serialNumber, setSerialNumber] = useState<string>('');
    const [inventoryNumber, setInventoryNumber] = useState<string>('');
    const [errorText, setErrorText] = useState<string>('');
    const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('inventory');
    const [error, setError] = useState<string | null>(null);

    const user = session?.user;

    const fetchFreight = useCallback(async () => {
        if (!user) return;

        try {
            const data = await fetchFreightData(user.id);
            setFreightList(data);
        } catch (error) {
            console.error('Error fetching freight data:', error);
            setErrorText('Error fetching freight data');
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchFreight();
        }
    }, [user, fetchFreight]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: async (results) => {
                    const data = results.data as Database['public']['Tables']['freight']['Insert'][];
                    const headers = results.meta.fields;

                    // Determine the selected option based on the headers
                    if (headers?.includes('year') && headers?.includes('make') && headers?.includes('model')) {
                        setSelectedOption('equipment');
                    } else if (headers?.includes('palletCount') && headers?.includes('commodity')) {
                        setSelectedOption('ltl_ftl');
                    }

                    for (const item of data) {
                        if (item.inventory_number && await checkDuplicateInventoryNumber(item.inventory_number)) {
                            window.alert(`Duplicate inventory number found: ${item.inventory_number}. Please use unique inventory numbers.`);
                            continue;
                        }

                        // Set default values for units if not provided
                        item.length_unit = item.length_unit || 'ft';
                        item.width_unit = item.width_unit || 'ft';
                        item.height_unit = item.height_unit || 'ft';
                        item.weight_unit = item.weight_unit || 'lbs';
                        item.freight_type = item.freight_type || selectedOption; // Use the determined selected option
                        item.user_id = user?.id || ''; // Add user_id from session

                        try {
                            const newFreight = await addFreightItem(item);
                            if (newFreight) {
                                setFreightList((prevList) => [...prevList, newFreight]);
                            }
                        } catch (error) {
                            console.error('Error adding freight item:', error);
                        }
                    }
                },
                error: (error) => {
                    console.error('Error parsing CSV file:', error);
                },
            });
        }
    };

    const addOrUpdateFreight = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Check for duplicate inventory number
        if (await checkDuplicateInventoryNumber(inventoryNumber)) {
            window.alert('Duplicate inventory number. Please use a unique inventory number.');
            return;
        }

        const freightData = {
            user_id: user.id,
            year: yearAmount,
            make: make,
            model: model,
            pallet_count: palletCount,
            commodity: commodity,
            length: length,
            length_unit: lengthUnit,
            width: width,
            width_unit: widthUnit,
            height: height,
            height_unit: heightUnit,
            weight: weight,
            weight_unit: weightUnit,
            serial_number: serialNumber,
            inventory_number: inventoryNumber,
            freight_type: selectedOption
        };

        let response: { data: Freight[] | null; error: { message: string } | null };
        if (editingFreight) {
            response = await supabase
                .from('freight')
                .update(freightData)
                .eq('id', editingFreight.id)
                .select();
        } else {
            response = await supabase
                .from('freight')
                .insert([freightData])
                .select();
        }

        const { data, error } = response;

        if (error) {
            console.error('Error adding/updating Inventory:', error.message);
            setErrorText('Error adding/updating Inventory');
        } else {
            setFreightList([...freightList.filter(f => f.id !== editingFreight?.id), ...(data || [])]);
            resetForm();
            setIsModalOpen(false);
        }
    };

    const deleteItem = async (id: number, table: 'freight') => {
        if (!user) return;

        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Error deleting from ${table}:`, error.message);
        } else {
            if (table === 'freight') {
                fetchFreight();
            }
        }
    };

    const handleDeleteClick = (id: number, table: 'freight') => {
        const confirmed = window.confirm(`Are you sure you want to delete this ${table} item?`);
        if (confirmed) {
            deleteItem(id, table);
        }
    };

    const editFreight = (freight: Freight) => {
        setEditingFreight(freight);
        setYearAmount(freight.year || '');
        setMake(freight.make || '');
        setModel(freight.model || '');
        setPalletCount(freight.pallet_count || '');
        setCommodity(freight.commodity || '');
        setLength(freight.length || '');
        setLengthUnit(freight.length_unit || 'ft');
        setWidth(freight.width || '');
        setWidthUnit(freight.width_unit || 'ft');
        setHeight(freight.height || '');
        setHeightUnit(freight.height_unit || 'ft');
        setWeight(freight.weight || '');
        setWeightUnit(freight.weight_unit || 'lbs');
        setSerialNumber(freight.serial_number || '');
        setInventoryNumber(freight.inventory_number || '');
        setSelectedOption(freight.freight_type || '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingFreight(null);
        setYearAmount('');
        setMake('');
        setModel('');
        setPalletCount('');
        setCommodity('');
        setLength('');
        setLengthUnit('ft'); // Reset to default unit
        setWidth('');
        setWidthUnit('ft'); // Reset to default unit
        setHeight('');
        setHeightUnit('ft'); // Reset to default unit
        setWeight('');
        setWeightUnit('lbs'); // Reset to default unit
        setSerialNumber('');
        setInventoryNumber('');
        setSelectedOption('equipment'); // Reset to default option
        setErrorText('');
    };

    const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const option = e.target.value;
        setSelectedOption(option);
        setErrorText('');
        if (option === 'ltl_ftl') {
            setLengthUnit('in');
            setWidthUnit('in');
            setHeightUnit('in');
        } else {
            setLengthUnit('ft');
            setWidthUnit('ft');
            setHeightUnit('ft');
        }
    };

    return (
        <div className="w-full grid grid-rows md:gap-6 md:pt-6 dark:bg-zinc-600">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center'>
                    <h1 className="xs:text-md mb-2 text-xl md:text-2xl font-medium text-center underline underline-offset-8">Freight Inventory</h1>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 dark:text-zinc-100  z-50 h-full  bg-opacity-50 flex justify-center items-center ">
                        <div className="dark:text-zinc-100 dark:bg-zinc-900 border border-zinc-700 shadow-lg bg-zinc-100 z-50 p-4 md:p-8 h-[770px] max-h-max my-16 rounded  w-full md:w-1/2 overflow-y-auto">
                            <h2 className="text-xl dark:text-zinc-100 mb-4 ">{editingFreight ? 'Edit Inventory' : 'Add Inventory'}</h2>
                            <form onSubmit={addOrUpdateFreight} className="flex  flex-col w-full gap-2 my-2 p-2 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100">
                                <div className='flex flex-col gap-4 w-full dark:bg-zinc-900 dark:text-zinc-100'>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Inventory Type
                                        <select
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            value={selectedOption}
                                            onChange={handleOptionChange}
                                        >
                                            <option value="">Select...</option>
                                            <option value="equipment">Equipment/Machinery</option>
                                            <option value="ltl_ftl">Commodity (pallets, crates, loose parts, etc.)</option>
                                        </select>
                                    </label>

                                    {selectedOption === 'equipment' && (
                                        <div className='md:flex gap-2 w-full'>
                                            <label className='dark:text-zinc-dark:text-zinc-100 font-medium'>Year
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
                                                    className="rounded text-zinc-900 w-full px-2 py-1  border border-zinc-900"
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
                                                className="rounded text-zinc-900 w-full px-2 py-1  border border-zinc-900"
                                                type="text"
                                                value={width}
                                                onChange={(e) => {
                                                    setErrorText('');
                                                    setWidth(e.target.value);
                                                }}
                                            />
                                            {selectedOption !== 'ltl_ftl' && (
                                                <select
                                                    className="rounded text-zinc-900 w-full px-2 py-1  border border-zinc-900"
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
                                                className="rounded text-zinc-900 w-full px-2 py-1  border border-zinc-900"
                                                type="text"
                                                value={height}
                                                onChange={(e) => {
                                                    setErrorText('');
                                                    setHeight(e.target.value);
                                                }}
                                            />
                                            {selectedOption !== 'ltl_ftl' && (
                                                <select
                                                    className="rounded text-zinc-900 w-full px-2 py-1  border border-zinc-900"
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
                                                className="rounded w-full px-2 py-1  border text-zinc-900 border-zinc-900"
                                                type="text"
                                                value={weight}
                                                onChange={(e) => {
                                                    setErrorText('');
                                                    setWeight(e.target.value);
                                                }}
                                            />
                                            <select
                                                className="rounded w-full px-2 py-1  text-zinc-900 border border-zinc-900"
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
                                    <button type="button" className="btn-slate mt-2 shadow-md hover:bg-stone-300/50 hover:text-zinc-700" onClick={resetForm}>
                                        Close
                                    </button>
                                )}
                                <button type="button" className="bg-stone-300  text-zinc-800 py-2 px-4 font-semibold mt-2 hover:bg-stone-300/50 hover:text-zinc-700" onClick={() => setIsModalOpen(false)}>
                                    Close
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {!!errorText && <div className="text-red-500">{errorText}</div>}
            </div>

            <div className='flex flex-col gap-2 justify-center items-center w-full'>
                <div className='flex md:flex-row flex-col-reverse gap-2 justify-between items-center w-full'>
                    <div className="mt-4 md:m-0">
                        <button className="body-btn" onClick={() => setIsModalOpen(true)}>
                            Add Inventory Item
                        </button>
                    </div>
                    <div className="mt-4 md:m-0 place-content-center self-center">
                        <label className="custom-file-upload">
                                <input className='hidden' type="file" accept=".csv" onChange={handleFileUpload} />
                            <span className="body-btn">Upload CSV</span>
                        
                        </label>

                    </div>

                    {errorText && <div className="text-red-500">{errorText}</div>}

                </div>

            </div>


            <div className="flex justify-between w-full border-b border-zinc-300">
            
                <button
                    className={`px-4 py-2 ${activeTab === 'inventory' ? 'border-b-2 border-red-300' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    Inventory
                </button>
                <div className='flex flex-col gap-2 justify-normal items-end'>
                    <div>
                        <a href="/public/EQUIPMENT_CSV_TEMPLATE.csv" download className="upload-button m-0 px-5 py-2 ">Download Equipment CSV Template </a>
                    </div>
                    <div className="mt-4 md:m-0">
                        <a href="/public/LTL-FTL_CSV_TEMPLATE.csv" download className="upload-button m-0 px-7 py-2">Download LTL/FTL CSV Template </a>
                    </div>

                </div>
                </div>

            
            <div className="w-full">
                    <InventoryTab
                        freightList={freightList}
                        editFreight={editFreight}
                        handleDeleteClick={(id) => handleDeleteClick(id, 'freight')}
                        handleAddFreight={addFreightItem}
                    />

            </div>
        </div>
    );
};

export default FreightInventory;