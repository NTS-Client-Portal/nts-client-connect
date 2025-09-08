// Utility function to format quote IDs for display
export const formatQuoteId = (id: number | string): string => {
    return `SP-${id}`;
};

// Utility function to parse quote ID from display format
export const parseQuoteId = (displayId: string): number => {
    const cleanId = displayId.replace('SP-', '');
    return parseInt(cleanId, 10);
};

// Type-safe display formatting
export const displayQuoteId = (quote: { id: number }): string => {
    return formatQuoteId(quote.id);
};
