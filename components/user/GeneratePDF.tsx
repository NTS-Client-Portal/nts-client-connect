import jsPDF from 'jspdf';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';

type ShippingQuotesRow = Database['public']['Tables']['shippingquotes']['Row'];

export const generatePDF = (quote: ShippingQuotesRow) => {
    const doc = new jsPDF();
    doc.text(`Order Receipt`, 10, 10);
    doc.text(`Quote ID: ${quote.id}`, 10, 20);
    doc.text(`Origin: ${quote.origin_street}, ${quote.origin_city}, ${quote.origin_state} ${quote.origin_zip}`, 10, 30);
    doc.text(`Destination: ${quote.destination_street}, ${quote.destination_city}, ${quote.destination_state} ${quote.destination_zip}`, 10, 40);
    doc.text(`Freight: ${quote.year} ${quote.make} ${quote.model}`, 10, 50);
    doc.text(`Shipping Date: ${quote.due_date || 'No due date'}`, 10, 60);
    doc.text(`Price: ${quote.price ? `$${quote.price}` : 'Not priced yet'}`, 10, 70);
    return doc;
};

export const uploadPDFToSupabase = async (pdf: jsPDF, quote: ShippingQuotesRow) => {
    const pdfBlob = pdf.output('blob');
    const fileName = `quotes/${quote.id}.pdf`;
    const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBlob);

    if (error) {
        throw new Error(error.message);
    }

    return data.path;
};

export const insertDocumentRecord = async (filePath: string, quote: ShippingQuotesRow) => {
    const { error } = await supabase
        .from('documents')
        .insert({
            user_id: quote.user_id,
            title: `Receipt for Quote ${quote.id}`,
            description: `Receipt for Quote ${quote.id}`,
            file_name: `${quote.id}.pdf`,
            file_type: 'application/pdf',
            file_url: filePath,
        });

    if (error) {
        throw new Error(error.message);
    }
};