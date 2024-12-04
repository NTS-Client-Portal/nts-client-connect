import React from 'react';

interface ContainerFormProps {
    containerLength: number | null;
    setContainerLength: (value: number | null) => void;
    containerType: string | null;
    setContainerType: (value: string | null) => void;
    contentsDescription: string | null;
    setContentsDescription: (value: string | null) => void;
    setErrorText: (value: string) => void;
}

const ContainerForm: React.FC<ContainerFormProps> = ({
    containerLength, setContainerLength, containerType, setContainerType, contentsDescription, setContentsDescription, setErrorText
}) => {
    return (
        <>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="number"
                        value={containerLength || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setContainerLength(e.target.value ? parseInt(e.target.value) : null);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={containerType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setContainerType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Contents Description
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={contentsDescription || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setContentsDescription(e.target.value);
                        }}
                    />
                </label>
            </div>
        </>
    );
};

export default ContainerForm;