import React from 'react';

interface FreightFormProps {
    year: string;
    setYear: (value: string) => void;
    make: string;
    setMake: (value: string) => void;
    model: string;
    setModel: (value: string) => void;
    palletCount: string;
    setPalletCount: (value: string) => void;
    commodity: string;
    setCommodity: (value: string) => void;
    setErrorText: (value: string) => void;
}

const EquipmentForm: React.FC<FreightFormProps> = ({
    year, setYear, make, setMake, model, setModel, palletCount, setPalletCount, commodity, setCommodity, setErrorText
}) => {
    return (
        <>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year/Amount
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={year}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={make}
                        onChange={(e) => {
                            setErrorText('');
                            setMake(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={model}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex w-full justify-evenly items-center self-center'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Pallet/Crate Count
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={palletCount}
                        onChange={(e) => {
                            setErrorText('');
                            setPalletCount(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Commodity
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={commodity}
                        onChange={(e) => {
                            setErrorText('');
                            setCommodity(e.target.value);
                        }}
                    />
                </label>
            </div>
        </>
    );
};

export default EquipmentForm;