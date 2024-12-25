import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { Session } from '@supabase/supabase-js';

interface RejectedProps {
    session: Session | null;
    selectedUserId: string;
}

const Rejected: React.FC<RejectedProps> = () => {
    const rejectedQuotes = [
        { id: 1, quote: 'Quote 1', reason: 'Placeholder', date: '2023-01-01' },
        { id: 2, quote: 'Quote 2', reason: 'Just proof of concept', date: '2023-01-02' },
        // Add more rejected quotes here
    ];

    return (
        <Paper>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Quote</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rejectedQuotes.map((quote) => (
                        <TableRow key={quote.id}>
                            <TableCell>{quote.id}</TableCell>
                            <TableCell>{quote.quote}</TableCell>
                            <TableCell>{quote.reason}</TableCell>
                            <TableCell>{quote.date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

export default Rejected;