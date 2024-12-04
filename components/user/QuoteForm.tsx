import React, { useState } from 'react';
import SelectOption from './SelectOption';

const QuoteForm: React.FC<{ isOpen: boolean; onClose: () => void; addQuote: (quote: any) => void; errorText: string; setErrorText: (value: string) => void; }> = ({ isOpen, onClose, addQuote, errorText, setErrorText }) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [palletCount, setPalletCount] = useState('');
    const [commodity, setCommodity] = useState('');
    const [saveToInventory, setSaveToInventory] = useState(false);

    // Container form state
    const [containerLength, setContainerLength] = useState<number | null>(null);
    const [containerType, setContainerType] = useState<string | null>(null);
    const [contentsDescription, setContentsDescription] = useState<string | null>(null);

    // RV Trailer form state
    const [classType, setClassType] = useState<string | null>(null);
    const [motorizedOrTrailer, setMotorizedOrTrailer] = useState<string | null>(null);
    const [roadworthy, setRoadworthy] = useState<boolean | null>(null);
    const [vin, setVin] = useState<string | null>(null);
    const [yearRv, setYearRv] = useState<number | null>(null);

    // Semi Truck form state
    const [driveawayOrTowaway, setDriveawayOrTowaway] = useState<boolean | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [vinSemi, setVinSemi] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [width, setWidth] = useState<string | null>(null);
    const [yearSemi, setYearSemi] = useState<number | null>(null);

    // Boat form state
    const [beam, setBeam] = useState('');
    const [cradle, setCradle] = useState(false);
    const [heightBoat, setHeightBoat] = useState('');
    const [lengthBoat, setLengthBoat] = useState('');
    const [trailer, setTrailer] = useState(false);
    const [type, setType] = useState('');
    const [weightBoat, setWeightBoat] = useState('');

    // Additional fields
    const [originZip, setOriginZip] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);

    const handleZipCodeBlur = (type: 'origin' | 'destination') => {
        // Logic to fetch city and state based on zip code
    };

    const handleZipCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'origin' | 'destination') => {
        if (e.key === 'Enter') {
            handleZipCodeBlur(type);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const quote = {
            selectedOption,
            year,
            make,
            model,
            palletCount,
            commodity,
            containerLength,
            containerType,
            contentsDescription,
            classType,
            motorizedOrTrailer,
            roadworthy,
            vin,
            yearRv,
            driveawayOrTowaway,
            height,
            length,
            vinSemi,
            weight,
            width,
            yearSemi,
            beam,
            cradle,
            heightBoat,
            lengthBoat,
            trailer,
            type,
            weightBoat,
            originZip,
            originCity,
            originState,
            destinationZip,
            destinationCity,
            destinationState,
            dueDate,
            saveToInventory
        };
        addQuote(quote);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded shadow-md w-1/2">
                <h2 className="text-xl mb-4">Request a Shipping Estimate</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <SelectOption
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        setErrorText={setErrorText}
                        year={year}
                        setYear={setYear}
                        make={make}
                        setMake={setMake}
                        model={model}
                        setModel={setModel}
                        palletCount={palletCount}
                        setPalletCount={setPalletCount}
                        commodity={commodity}
                        setCommodity={setCommodity}
                        containerLength={containerLength}
                        setContainerLength={setContainerLength}
                        containerType={containerType}
                        setContainerType={setContainerType}
                        contentsDescription={contentsDescription}
                        setContentsDescription={setContentsDescription}
                        classType={classType}
                        setClassType={setClassType}
                        motorizedOrTrailer={motorizedOrTrailer}
                        setMotorizedOrTrailer={setMotorizedOrTrailer}
                        roadworthy={roadworthy}
                        setRoadworthy={setRoadworthy}
                        vin={vin}
                        setVin={setVin}
                        yearRv={yearRv}
                        setYearRv={setYearRv}
                        driveawayOrTowaway={driveawayOrTowaway}
                        setDriveawayOrTowaway={setDriveawayOrTowaway}
                        height={height}
                        setHeight={setHeight}
                        length={length}
                        setLength={setLength}
                        vinSemi={vinSemi}
                        setVinSemi={setVinSemi}
                        weight={weight}
                        setWeight={setWeight}
                        width={width}
                        setWidth={setWidth}
                        yearSemi={yearSemi}
                        setYearSemi={setYearSemi}
                        beam={beam}
                        setBeam={setBeam}
                        cradle={cradle}
                        setCradle={setCradle}
                        heightBoat={heightBoat}
                        setHeightBoat={setHeightBoat}
                        lengthBoat={lengthBoat}
                        setLengthBoat={setLengthBoat}
                        trailer={trailer}
                        setTrailer={setTrailer}
                        type={type}
                        setType={setType}
                        weightBoat={weightBoat}
                        setWeightBoat={setWeightBoat}
                    />
                    {selectedOption && (
                        <div className='flex gap-1 text-zinc-900 font-semibold'>
                            <input
                                type="checkbox"
                                checked={saveToInventory}
                                onChange={(e) => setSaveToInventory(e.target.checked)}
                            />
                            Check Here to Save Inventory
                        </div>
                    )}
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Length
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={length}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLength(e.target.value);
                                }}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Width
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={width}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWidth(e.target.value);
                                }}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Height
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={height}
                                onChange={(e) => {
                                    setErrorText('');
                                    setHeight(e.target.value);
                                }}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={weight}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWeight(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Zip
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={originZip}
                                onChange={(e) => setOriginZip(e.target.value)}
                                onBlur={() => handleZipCodeBlur('origin')}
                                onKeyDown={(e) => handleZipCodeKeyDown(e, 'origin')}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin City
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={originCity}
                                readOnly
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin State
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={originState}
                                readOnly
                            />
                        </label>
                    </div>
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Zip
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={destinationZip}
                                onChange={(e) => setDestinationZip(e.target.value)}
                                onBlur={() => handleZipCodeBlur('destination')}
                                onKeyDown={(e) => handleZipCodeKeyDown(e, 'destination')}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination City
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={destinationCity}
                                readOnly
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination State
                            <input
                                className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                                type="text"
                                value={destinationState}
                                readOnly
                            />
                        </label>
                    </div>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Shipping Date
                        <input
                            className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                            type="date"
                            value={dueDate || ''} // Ensure dueDate is either a valid timestamp or an empty string
                            onChange={(e) => {
                                setErrorText('');
                                setDueDate(e.target.value || null); // Set dueDate to null if the input is empty
                            }}
                        />
                    </label>
                    <button type="submit" className="body-btn w-2/3 place-self-center">
                        Submit
                    </button>
                    <button onClick={onClose} className="cancel-btn mt-4 w-2/3 place-self-center">
                        Close
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuoteForm;