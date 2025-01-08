import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import Papa from 'papaparse';
import { Database } from '@lib/database.types';
import InventoryTab from '@/components/inventory/InventoryTab';
import { checkDuplicateInventoryNumber, addFreightItem } from '@lib/database';
import FreightFormModal from '@/components/FreightFormModal';

interface FreightInventoryProps {
    session: Session | null;
}

type Freight = Database['public']['Tables']['freight']['Row'];

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
            const { data, error } = await supabase
                .from('freight')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                throw new Error(error.message);
            }

            setFreightList(data || []);
        } catch (error) {
            console.error('Error fetching freight data:', error);
            setErrorText('Error fetching freight data');
        }
    }, [user, supabase]);

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
            freight_type: selectedOption // Ensure this is set
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
                <FreightFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={addOrUpdateFreight}
                    editingFreight={!!editingFreight}
                    selectedOption={selectedOption}
                    handleOptionChange={handleOptionChange}
                    yearAmount={yearAmount}
                    setYearAmount={setYearAmount}
                    make={make}
                    setMake={setMake}
                    model={model}
                    setModel={setModel}
                    palletCount={palletCount}
                    setPalletCount={setPalletCount}
                    commodity={commodity}
                    setCommodity={setCommodity}
                    length={length}
                    setLength={setLength}
                    lengthUnit={lengthUnit}
                    setLengthUnit={setLengthUnit}
                    width={width}
                    setWidth={setWidth}
                    widthUnit={widthUnit}
                    setWidthUnit={setWidthUnit}
                    height={height}
                    setHeight={setHeight}
                    heightUnit={heightUnit}
                    setHeightUnit={setHeightUnit}
                    weight={weight}
                    setWeight={setWeight}
                    weightUnit={weightUnit}
                    setWeightUnit={setWeightUnit}
                    serialNumber={serialNumber}
                    setSerialNumber={setSerialNumber}
                    inventoryNumber={inventoryNumber}
                    setInventoryNumber={setInventoryNumber}
                    setErrorText={setErrorText}
                />
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
                <div className='flex flex-col gap-2 justify-normal items-start'>
                    <div>
                        <a href="/public/EQUIPMENT_CSV_TEMPLATE.csv" download className="text-ntsLightBlue underline m-0 px-2 py-2 ">Download Equipment CSV Template </a>
                    </div>
                    <div className="mt-4 md:m-0">
                        <a href="/public/LTL-FTL_CSV_TEMPLATE.csv" download className="text-ntsLightBlue underline text-start m-0 px-2 py-2">Download LTL/FTL CSV Template </a>
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