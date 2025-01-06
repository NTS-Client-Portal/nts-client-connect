import { Document, Packer, Paragraph, TextRun } from "docx";
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

const parseHtmlToDocx = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const paragraphs: Paragraph[] = [];

    doc.body.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.tagName === "STYLE") {
                // Ignore <style> tags
                return;
            }
            const textRuns: TextRun[] = [];

            element.childNodes.forEach((childNode) => {
                if (childNode.nodeType === Node.TEXT_NODE) {
                    textRuns.push(new TextRun({ text: childNode.textContent || "" }));
                } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                    const childElement = childNode as HTMLElement;
                    let textRun = new TextRun({ text: childElement.textContent || "" });

                    if (
                        childElement.tagName === "STRONG" ||
                        childElement.tagName === "B"
                    ) {
                        textRun = new TextRun({
                            text: childElement.textContent || "",
                            bold: true,
                        });
                    }
                    if (childElement.tagName === "EM" || childElement.tagName === "I") {
                        textRun = new TextRun({
                            text: childElement.textContent || "",
                            italics: true,
                        });
                    }
                    if (childElement.tagName === "U") {
                        textRun = new TextRun({
                            text: childElement.textContent || "",
                            underline: {},
                        });
                    }

                    textRuns.push(textRun);
                }
            });

            paragraphs.push(new Paragraph({ children: textRuns }));
        }
    });

    return paragraphs;
};

export const generateDocx = async (
    quote: ShippingQuotesRow,
    templateContent: string
) => {
    const content = replaceShortcodes(templateContent, { quote });
    const paragraphs = parseHtmlToDocx(content);

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: paragraphs,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    return { buffer, content };
};

const bufferToArrayBuffer = (buffer: Buffer): ArrayBuffer => {
    return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
};

export const uploadDocxToSupabase = async (
    buffer: Buffer,
    fileName: string
) => {
    const arrayBuffer = bufferToArrayBuffer(buffer);
    const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const { data, error } = await supabase.storage
        .from("documents")
        .upload(fileName, blob, { upsert: true });

    if (error) {
        throw new Error(error.message);
    }

    return data.path;
};

export const insertDocumentRecord = async (
    filePath: string,
    quote: ShippingQuotesRow,
    templateTitle: string,
    templateId: string
) => {
    const { data, error } = await supabase
        .from("documents")
        .upsert({
            user_id: quote.user_id,
            title: `${templateTitle} for Quote ${quote.id}`,
            description: `${templateTitle} for Quote ${quote.id}`,
            file_name: `${templateTitle.replace(/\s+/g, "_")}_for_Order_${quote.id
                }.docx`,
            file_type:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_url: filePath,
            template_id: templateId, // Include the template ID
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

interface GenerateAndUploadDocxParams {
    quote: ShippingQuotesRow;
    content: string;
    title: string;
    templateId: string;
}

export const generateAndUploadDocx = async (
    quote: ShippingQuotesRow,
    content: string,
    title: string,
    templateId: string
) => {
    // Generate the DOCX file using the content and title
    const { buffer } = await generateDocx(quote, content);

    // Upload the DOCX file to Supabase storage
    const filePath = await uploadDocxToSupabase(buffer, `path/to/${title}.docx`);

    // Insert the document record with the template ID
    const documentData = await insertDocumentRecord(
        filePath,
        quote,
        title,
        templateId
    );

    // Create a notification for the user
    await createNotification(quote.user_id, documentData.id, title);

    return filePath;
};
