import React, { useState } from 'react';
import Modal from 'react-modal';
import { IoIosStarOutline, IoIosStar } from "react-icons/io";


Modal.setAppElement('#__next'); // Set the app element for accessibility

interface RatingModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    onSubmit: (rating: number, resolved: boolean, explanation: string) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onRequestClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [resolved, setResolved] = useState<boolean | null>(null);
    const [explanation, setExplanation] = useState('');

    const handleRatingClick = (value: number) => {
        setRating(value);
    };

    const handleResolvedChange = (value: boolean) => {
        setResolved(value);
    };

    const handleSubmit = () => {
        onSubmit(rating, resolved === true, explanation);
        onRequestClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Rate Support"
            className="modal"
            overlayClassName="overlay"
        >
            <h2 className="text-lg font-semibold mb-4">Rate Your Support</h2>
            <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        onClick={() => handleRatingClick(value)}
                        className="text-yellow-500"
                    >
                        {value <= rating ? <IoIosStar className="fill-current" /> : <IoIosStarOutline />}
                    </button>
                ))}
            </div>
            <div className="mb-4">
                <p className="font-semibold">Was your issue resolved?</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleResolvedChange(true)}
                        className={`px-4 py-2 rounded-md ${resolved === true ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => handleResolvedChange(false)}
                        className={`px-4 py-2 rounded-md ${resolved === false ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        No
                    </button>
                </div>
            </div>
            {resolved === false && (
                <div className="mb-4">
                    <p className="font-semibold">Please explain the issue:</p>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            )}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                    Submit
                </button>
            </div>
        </Modal>
    );
};

export default RatingModal;