// src/components/ListingCard.tsx
import React from 'react';

interface Rating {
    overall: number | null;
    reviews_count: number | null;
    old_system_rating: number | null;
    old_system_reviews: number | null;
}

interface ListingCardProps {
    quote: {
        year: string | null;
        make: string | null;
        model: string | null;
        price: number | null;
        price_per_mile: number | string | null;
        total_miles: number | null;
        origin_city: string | null;
        origin_state: string | null;
        destination_city: string | null;
        destination_state: string | null;
        earliest_pickup_date: string | null;
        due_date: string | null;
        company_name: string | null;
        company_phone: string | null;
        hours: string | null;
        rating: Rating;
        additional_info: string | null;
        additional_phone: string | null;
    };
}

export const ListingCard: React.FC<ListingCardProps> = ({ quote }) => {
    return (
        <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            {/* Price */}
            <div className='flex justify-between items-center'>
                <div className="text-ntsBlue font-bold text-lg">
                    ${quote.price} <br />
                    <span className="text-gray-500 text-sm">
                        {quote.total_miles ? ` (${quote.total_miles} mi @ ${quote.price_per_mile}/mi)` : ''}
                    </span>
                </div>

                {/* Vehicle Info */}
                <div className="text-gray-700 text-sm mb-2">
                    <span className="font-semibold">{quote.year} {quote.make} {quote.model}</span>
                </div>

                {/* General Info */}
                <div className="text-gray-600 text-sm">
                    <p>
                        <strong>Origin:</strong> {quote.origin_city}, {quote.origin_state}
                    </p>
                    <p>
                        <strong>Destination:</strong> {quote.destination_city}, {quote.destination_state}
                    </p>
                    <p>
                        <strong>Pickup Date:</strong> {quote.earliest_pickup_date}
                    </p>
                    <p>
                        <strong>Delivery Date:</strong> {quote.due_date}
                    </p>
                </div>

                {/* Company Info */}
                <div className="mt-4 text-gray-600 text-sm">
                    <p>
                        <strong>Company:</strong> {quote.company_name}
                    </p>
                    <p>
                        <strong>Phone:</strong> {quote.company_phone}
                    </p>
                    <p>
                        <strong>Hours:</strong> {quote.hours}
                    </p>
                    <p>
                        <strong>Rating:</strong> {quote.rating.overall}/5 ({quote.rating.reviews_count} reviews)
                    </p>
                </div>

                {/* Additional Info */}
                {quote.additional_info && (
                    <div className="mt-4 text-sm text-gray-500">
                        <p><strong>Note:</strong> {quote.additional_info}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
