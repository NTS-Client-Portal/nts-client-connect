import React from 'react';
import EquipmentForm from './EquipmentForm';
import ContainerForm from './ContainerForm';
import RvTrailerForm from './RvTrailerForm';
import SemiTruckForm from './SemiTruckForm';
import BoatForm from './BoatForm';

interface SelectOptionProps {
    selectedOption: string;
    setSelectedOption: (value: string) => void;
    setErrorText: (value: string) => void;

    // EquipmentForm props
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

    // ContainerForm props
    containerLength: number | null;
    setContainerLength: (value: number | null) => void;
    containerType: string | null;
    setContainerType: (value: string | null) => void;
    contentsDescription: string | null;
    setContentsDescription: (value: string | null) => void;

    // RvTrailerForm props
    classType: string | null;
    setClassType: (value: string | null) => void;
    motorizedOrTrailer: string | null;
    setMotorizedOrTrailer: (value: string | null) => void;
    roadworthy: boolean | null;
    setRoadworthy: (value: boolean | null) => void;
    vin: string | null;
    setVin: (value: string | null) => void;
    yearRv: number | null;
    setYearRv: (value: number | null) => void;

    // SemiTruckForm props
    driveawayOrTowaway: boolean | null;
    setDriveawayOrTowaway: (value: boolean | null) => void;
    height: string | null;
    setHeight: (value: string | null) => void;
    length: string | null;
    setLength: (value: string | null) => void;
    vinSemi: string | null;
    setVinSemi: (value: string | null) => void;
    weight: string | null;
    setWeight: (value: string | null) => void;
    width: string | null;
    setWidth: (value: string | null) => void;
    yearSemi: number | null;
    setYearSemi: (value: number | null) => void;

    // BoatForm props
    beam: string;
    setBeam: (value: string) => void;
    cradle: boolean;
    setCradle: (value: boolean) => void;
    heightBoat: string;
    setHeightBoat: (value: string) => void;
    lengthBoat: string;
    setLengthBoat: (value: string) => void;
    trailer: boolean;
    setTrailer: (value: boolean) => void;
    type: string;
    setType: (value: string) => void;
    weightBoat: string;
    setWeightBoat: (value: string) => void;
}

const SelectOption: React.FC<SelectOptionProps> = ({
    selectedOption,
    setSelectedOption,
    setErrorText,
    year,
    setYear,
    make,
    setMake,
    model,
    setModel,
    palletCount,
    setPalletCount,
    commodity,
    setCommodity,
    containerLength,
    setContainerLength,
    containerType,
    setContainerType,
    contentsDescription,
    setContentsDescription,
    classType,
    setClassType,
    motorizedOrTrailer,
    setMotorizedOrTrailer,
    roadworthy,
    setRoadworthy,
    vin,
    setVin,
    yearRv,
    setYearRv,
    driveawayOrTowaway,
    setDriveawayOrTowaway,
    height,
    setHeight,
    length,
    setLength,
    vinSemi,
    setVinSemi,
    weight,
    setWeight,
    width,
    setWidth,
    yearSemi,
    setYearSemi,
    beam,
    setBeam,
    cradle,
    setCradle,
    heightBoat,
    setHeightBoat,
    lengthBoat,
    setLengthBoat,
    trailer,
    setTrailer,
    type,
    setType,
    weightBoat,
    setWeightBoat,
}) => {
    return (
        <>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Select Option
                <select
                    className="rounded w-full dark:text-zinc-800 p-2 border border-zinc-900"
                    value={selectedOption}
                    onChange={(e) => {
                        setErrorText('');
                        setSelectedOption(e.target.value);
                    }}
                >
                    <option value="">Select...</option>
                    <option value="equipment">Equipment/Machinery</option>
                    <option value="ltl_ftl">LTL/FTL</option>
                    <option value="containers">Containers</option>
                    <option value="rv_trailers">RV Trailers</option>
                    <option value="semi_trucks">Semi Trucks</option>
                    <option value="boats">Boats</option>
                </select>
            </label>

            {selectedOption === 'equipment' && (
                <EquipmentForm
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
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'containers' && (
                <ContainerForm
                    containerLength={containerLength}
                    setContainerLength={setContainerLength}
                    containerType={containerType}
                    setContainerType={setContainerType}
                    contentsDescription={contentsDescription}
                    setContentsDescription={setContentsDescription}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'rv_trailers' && (
                <RvTrailerForm
                    classType={classType}
                    setClassType={setClassType}
                    make={make}
                    setMake={setMake}
                    model={model}
                    setModel={setModel}
                    motorizedOrTrailer={motorizedOrTrailer}
                    setMotorizedOrTrailer={setMotorizedOrTrailer}
                    roadworthy={roadworthy}
                    setRoadworthy={setRoadworthy}
                    vin={vin}
                    setVin={setVin}
                    year={yearRv}
                    setYear={setYearRv}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'semi_trucks' && (
                <SemiTruckForm
                    driveawayOrTowaway={driveawayOrTowaway}
                    setDriveawayOrTowaway={setDriveawayOrTowaway}
                    height={height}
                    setHeight={setHeight}
                    length={length}
                    setLength={setLength}
                    make={make}
                    setMake={setMake}
                    model={model}
                    setModel={setModel}
                    vin={vinSemi}
                    setVin={setVinSemi}
                    weight={weight}
                    setWeight={setWeight}
                    width={width}
                    setWidth={setWidth}
                    year={yearSemi}
                    setYear={setYearSemi}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'boats' && (
                <BoatForm
                    beam={beam}
                    setBeam={setBeam}
                    cradle={cradle}
                    setCradle={setCradle}
                    height={heightBoat}
                    setHeight={setHeightBoat}
                    length={lengthBoat}
                    setLength={setLengthBoat}
                    trailer={trailer}
                    setTrailer={setTrailer}
                    type={type}
                    setType={setType}
                    weight={weightBoat}
                    setWeight={setWeightBoat}
                    setErrorText={setErrorText}
                />
            )}
        </>
    );
};

export default SelectOption;