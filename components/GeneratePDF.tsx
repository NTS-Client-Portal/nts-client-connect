import jsPDF from "jspdf";
import { supabase } from "@/lib/initSupabase";
import { Database } from "@/lib/database.types";

type ShippingQuotesRow = Database["public"]["Tables"]["shippingquotes"]["Row"];

export const replaceShortcodes = (templateContent: string, data: any) => {
	return templateContent.replace(/{(.*?)}/g, (_, key) => {
		const keys = key.split(".");
		let value: any = data;
		for (const k of keys) {
			value = value[k];
			if (value === undefined) {
				return `{${key}}`; // Return the original shortcode if the value is not found
			}
		}
		return value;
	});
};

export const generatePDF = async (
	quote: ShippingQuotesRow,
	templateContent: string
) => {
	const doc = new jsPDF();
	const content = replaceShortcodes(templateContent, { quote });
	await doc.html(content, {
		callback: function (doc) {
			doc.save();
		},
		x: 10,
		y: 10,
		html2canvas: {
			scale: 0.5, // Adjust the scale to ensure the font size is correctly applied
		},
	}); // Use html to handle HTML content
	return doc;
};

export const uploadPDFToSupabase = async (pdf: jsPDF, fileName: string) => {
	const pdfBlob = pdf.output("blob");
	const { data, error } = await supabase.storage
		.from("documents")
		.upload(fileName, pdfBlob, { upsert: true });

	if (error) {
		throw new Error(error.message);
	}

	return data.path;
};

export const insertDocumentRecord = async (
	filePath: string,
	quote: ShippingQuotesRow,
	templateTitle: string
) => {
	const { data, error } = await supabase
		.from("documents")
		.upsert({
			user_id: quote.user_id,
			title: `${templateTitle} for Quote ${quote.id}`,
			description: `${templateTitle} for Quote ${quote.id}`,
			file_name: `${templateTitle.replace(/\s+/g, "_")}_for_Order_${
				quote.id
			}.pdf`,
			file_type: "application/pdf",
			file_url: filePath,
		})
		.select()
		.single();

	if (error) {
		throw new Error(error.message);
	}

	return data;
};

export const createNotification = async (
	userId: string,
	documentId: number,
	templateTitle: string
) => {
	const { error } = await supabase.from("notifications").insert({
		user_id: userId,
		message: `A new document titled "${templateTitle}" has been generated and uploaded.`,
		document_id: documentId,
	});

	if (error) {
		throw new Error(error.message);
	}
};

export const generateAndUploadPDF = async (
	quote: ShippingQuotesRow,
	templateContent: string,
	templateTitle: string
) => {
	const pdf = await generatePDF(quote, templateContent);
	const fileName = `${templateTitle.replace(/\s+/g, "_")}_for_Order_${
		quote.id
	}.pdf`;
	const filePath = await uploadPDFToSupabase(pdf, fileName);
	const documentData = await insertDocumentRecord(
		filePath,
		quote,
		templateTitle
	);
	await createNotification(quote.user_id, documentData.id, templateTitle);
};
