import React, { useEffect, useState, useCallback } from "react";
import { useSupabaseClient } from '@/lib/supabase/provider';
import { Session } from '@supabase/supabase-js';
import { Database } from "@/lib/database.types";
import { FolderHeart, Folder, Menu, Star, Trash2, X, Download, Eye, Upload } from "lucide-react";
import { updateFavoriteStatus } from "@/lib/database";
import { useDocumentNotification } from "@/context/DocumentNotificationContext";
import { generateAndUploadDocx, replaceShortcodes } from "@/components/GenerateDocx";

interface DocumentsProps {
	session: Session | null;
}

const Documents: React.FC<DocumentsProps> = ({ session }) => {
	const supabase = useSupabaseClient<Database>();
	const [documents, setDocuments] = useState<Database["public"]["Tables"]["documents"]["Row"][]>([]);
	const [importantDocuments, setImportantDocuments] = useState<Database["public"]["Tables"]["documents"]["Row"][]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [activeSection, setActiveSection] = useState("all"); // State to control active section
	const [sidebarOpen, setSidebarOpen] = useState(false); // State to control sidebar visibility
	const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
	const [documentToDelete, setDocumentToDelete] = useState<number | null>(null); // State to store the document to be deleted
	const [isNtsUser, setIsNtsUser] = useState(false);
	const [viewFileUrl, setViewFileUrl] = useState<string | null>(null); // State to store the file URL for viewing
	const [currentPage, setCurrentPage] = useState(1); // State to control pagination
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // State to control sort order
	const itemsPerPage = 15; // Number of items per page for desktop

	const [viewFileContent, setViewFileContent] = useState<string | null>(null);

	const { setNewDocumentAdded } = useDocumentNotification();

	const fetchDocuments = useCallback(async () => {
		if (!session) return;

		setLoading(true);
		const { data, error } = await supabase
			.from("documents")
			.select("*")
			.or(`user_id.eq.${session.user.id},nts_user_id.eq.${session.user.id}`) // Filtering documents by the authenticated user's ID or nts_user_id
			.order("created_at", { ascending: sortOrder === "asc" }); // Sorting by created_at

		if (error) {
			setError(error.message);
		} else {
			setDocuments(data);
			setImportantDocuments(data.filter((doc) => doc.is_favorite));
		}
		setLoading(false);
	}, [session, supabase, sortOrder]);

	useEffect(() => {
		const checkNtsUser = async () => {
			if (session?.user?.id) {
				const { data, error } = await supabase
					.from("nts_users")
					.select("id")
					.eq("id", session.user.id)
					.single();

				if (data) {
					setIsNtsUser(true);
				}
			}
		};

		checkNtsUser();
		fetchDocuments();
	}, [session, fetchDocuments, supabase]); // Include 'supabase' in the dependency array

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			console.log('Selected file:', e.target.files[0]);
			await handleUpload(e.target.files[0]); // Call handleUpload after setting the file
		}
	};

	const handleUpload = async (file: File) => {
		console.log('File:', file);
		console.log('Session:', session);

		if (!file || !session) return;

		try {
			const filePath = await uploadFileToSupabase(file, session.user.id);
			const documentData = await saveDocumentMetadata(
				session.user.id,
				file.name,
				filePath,
				title,
				description
			);
			setTitle("");
			setDescription("");
			setFile(null);
			fetchDocuments();

			const { error: notificationError } = await supabase
				.from("notifications")
				.insert({
					user_id: session.user.id,
					message: `A new document titled "${title}" has been uploaded.`,
					document_id: documentData.id,
				});

			if (notificationError) {
				console.error(
					"Error creating notification:",
					notificationError.message
				);
			}

			// Set the notification state
			setNewDocumentAdded(true);
		} catch (error) {
			console.error('Error uploading document:', error);
			setError(error.message);
		}
	};

	const uploadFileToSupabase = async (file: File, userId: string) => {
		const fileExt = file.name.split(".").pop();
		const fileName = `${userId}/${Date.now()}.${fileExt}`;
		const { data, error } = await supabase.storage
			.from("documents")
			.upload(fileName, file);

		if (error) {
			throw new Error(error.message);
		}

		return data.path;
	};

	const saveDocumentMetadata = async (
		userId: string,
		fileName: string,
		filePath: string,
		title: string,
		description: string
	) => {
		const { data, error } = await supabase
			.from("documents")
			.insert({
				user_id: isNtsUser ? null : userId,
				nts_user_id: isNtsUser ? userId : null,
				title,
				description,
				file_name: fileName,
				file_type: file.type,
				file_url: filePath,
			})
			.select()
			.single();

		if (error) {
			throw new Error(error.message);
		}

		return data;
	};

	const handleFavoriteToggle = async (
		documentId: number,
		isFavorite: boolean
	) => {
		const { data, error } = await updateFavoriteStatus(documentId, isFavorite);
		if (error) {
			setError(error.message);
		} else {
			fetchDocuments();
		}
	};

	const handleDelete = async () => {
		if (!documentToDelete) return;

		const { error } = await supabase
			.from("documents")
			.delete()
			.eq("id", documentToDelete);

		if (error) {
			setError(error.message);
		} else {
			fetchDocuments();
			setIsModalOpen(false);
			setDocumentToDelete(null);
		}
	};

	const openDeleteModal = (documentId: number) => {
		setDocumentToDelete(documentId);
		setIsModalOpen(true);
	};

	const handleDownload = async (fileUrl: string, fileName: string) => {
		const { data, error } = await supabase.storage
			.from("documents")
			.download(fileUrl);

		if (error) {
			setError(error.message);
			return;
		}

		const url = window.URL.createObjectURL(data);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleView = async (fileUrl: string) => {
		const { data, error } = await supabase.storage
			.from("documents")
			.download(fileUrl);

		if (error) {
			setError(error.message);
			return;
		}

		const url = window.URL.createObjectURL(data);
		setViewFileUrl(url);
	};

	const handleViewDocument = async (templateId: string | null, documentId: number) => {
		if (!templateId) {
			setError("Template ID is missing.");
			return;
		}

		// Fetch the document data to get the quote_id
		const { data: document, error: documentError } = await supabase
			.from("documents")
			.select("id")
			.eq("id", documentId)
			.single();

		if (documentError) {
			setError(documentError.message);
			return;
		}

		const quoteId = document.id;

		// Fetch the updated quote data
		const { data: quote, error: quoteError } = await supabase
			.from("shippingquotes")
			.select("*")
			.eq("id", quoteId)
			.single();

		if (quoteError) {
			setError(quoteError.message);
			return;
		}

		// Fetch the template content
		const { data: templateData, error: templateError } = await supabase
			.from("templates")
			.select("content")
			.eq("id", templateId)
			.single();

		if (templateError) {
			setError(templateError.message);
			return;
		}

		const content = replaceShortcodes(templateData.content, { quote });
		setViewFileContent(content);
	};

	const renderDocuments = (
		docs: Database["public"]["Tables"]["documents"]["Row"][]
	) => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		const paginatedDocs = docs.slice(startIndex, endIndex);

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{paginatedDocs.map((doc) => (
					<div key={doc.id} className="bg-white dark:bg-zinc-800 dark:text-white shadow rounded-md p-4 border border-zinc-400" >
						<div className="flex justify-between items-center mb-2">
							<div className="text-sm font-extrabold text-zinc-500 dark:text-white">
								{doc.title}
							</div>
							<div className="flex items-center">
								<button onClick={() => handleFavoriteToggle(doc.id, !doc.is_favorite)}  >
									{doc.is_favorite ? (
										<Star className="text-yellow-500" />
									) : (
										<Star />
									)}
								</button>
								<button onClick={() => openDeleteModal(doc.id)} className="ml-2">
									<Trash2 className="text-red-500" />
								</button>
							</div>
						</div>
						<div className="text-sm text-zinc-900 dark:text-white mb-2">
							{doc.description}
						</div>
						<div className="flex justify-between items-start gap-2">
							<button onClick={() => handleViewDocument(doc.template_id, doc.id)}
								className="text-ntsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm">
								<Eye className="h-4 w-auto" /> View
							</button>
							<button onClick={() => handleDownload(doc.file_url, doc.file_name)} className="text-ntsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm">
								<Download className="h-4 w-auto" />
								Download
							</button>
						</div>
					</div>
				))}
			</div>
		);
	};

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber);
	};

	const totalPages = Math.ceil(documents.length / itemsPerPage);

	return (
		<div className="flex ">
			{/* Sidebar */}
			<div
				className={` transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
					}  overflow-auto transition-transform duration-300 ease-in-out w-64 bg-zinc-200 dark:bg-zinc-900 dark:text-white p-4 border-r border-t border-zinc-700/20 shadow-lg md:relative md:translate-x-0`}
			>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">Documents</h2>
					<button className="md:hidden" onClick={() => setSidebarOpen(false)}>
						<X className="h-6 w-6" />
					</button>
				</div>
				<ul className="space-y-2">
					<li className="flex gap-1 items-center">
						<Folder />
						<button
							className={`w-full text-left p-2 ${activeSection === "all" ? "bg-zinc-100 dark:text-zinc-800" : ""
								}`}
							onClick={() => setActiveSection("all")}
						>
							All Documents
						</button>
					</li>
					<li className="flex gap-1 items-center">
						<FolderHeart />
						<button
							className={`w-full text-left p-2 ${activeSection === "important"
								? "bg-zinc-100 dark:text-zinc-800"
								: ""
								}`}
							onClick={() => setActiveSection("important")}
						>
							Important
						</button>
					</li>
				</ul>
			</div>

			{/* Main Content */}
			<div className="flex-1 p-4 ml-0">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-4">
					<h1 className="text-2xl text-nowrap font-bold">
						{activeSection === "all" && "All Documents"}
						{activeSection === "important" && "Important"}
					</h1>
					<div className="md:hidden flex justify-between md:justify-normal gap-2">
						<input
							type="file"
							onChange={handleFileChange}
							className="hidden"
							id="file-upload-mobile"
						/>
						<label
							htmlFor="file-upload-mobile"
							className="text-NtsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm mt-1 cursor-pointer"
						>
							<Upload className="h-4" /> Upload Documents
						</label>
					</div>
				</div>

				<div className="flex items-center justify-between w-full mb-2">
					<div className="">
						<label className="mr-2">Sort by:</label>
						<select
							value={sortOrder}
							onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
							className="rounded p-1 bg-white border shadow-md"
						>
							<option value="desc">Newest First</option>
							<option value="asc">Oldest First</option>
						</select>
					</div>

					{totalPages > 1 && (
						<div className="hidden md:flex justify-center items-center mt-4 mb-2">
							<button
								className="text-ntsLightBlue font-semibold underline mx-1"
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
							>
								Previous
							</button>
							<span className="mx-2 font-semibold text-base text-NtsBlue">
								{currentPage} / {totalPages}
							</span>
							<button
								className="text-ntsLightBlue font-semibold underline mx-1"
								onClick={() =>
									setCurrentPage((prev) => Math.min(prev + 1, totalPages))
								}
								disabled={currentPage === totalPages}
							>
								Next
							</button>
						</div>
					)}

					<input
						type="file"
						onChange={handleFileChange}
						className="hidden"
						id="file-upload-desktop"
					/>
					<label
						htmlFor="file-upload-desktop"
						className="text-NtsBlue border shadow-sm px-2 py-1 rounded-md flex items-center justify-start gap-1 font-semibold text-sm mt-1 cursor-pointer"
					>
						<Upload className="h-4" /> Upload Documents
					</label>
				</div>

				{/* Documents List */}
				{loading ? (
					<p>Loading...</p>
				) : error ? (
					<p className="text-red-600">{error}</p>
				) : activeSection === "all" ? (
					documents.length === 0 ? (
						<p>No documents found.</p>
					) : (
						renderDocuments(documents)
					)
				) : activeSection === "important" ? (
					importantDocuments.length === 0 ? (
						<p>No important documents found.</p>
					) : (
						renderDocuments(importantDocuments)
					)
				) : null}

				{/* Pagination */}
				<div className="flex justify-center">
					{Array.from({ length: totalPages }, (_, index) => (
						<button
							key={index}
							onClick={() => handlePageChange(index + 1)}
							className={`px-4 py-2 mx-1 mt-4 mb-8 rounded ${currentPage === index + 1
								? "bg-blue-500 text-white"
								: "bg-gray-200"
								}`}
						>
							{index + 1}
						</button>
					))}
				</div>

				{/* Delete Confirmation Modal */}

				{isModalOpen && (
					<div className="fixed inset-0 flex items-center justify-center z-50">
						<div className="fixed inset-0 bg-black opacity-50"></div>
						<div className="bg-white rounded-lg shadow-lg p-6 z-50">
							<h2 className="text-xl font-bold mb-4">Delete Document</h2>
							<p className="mb-4">
								Are you sure you want to delete this document?
							</p>
							<div className="flex justify-end">
								<button
									className="bg-zinc-300 text-zinc-700 px-4 py-2 rounded mr-2"
									onClick={() => setIsModalOpen(false)}
								>
									Cancel
								</button>
								<button
									className="bg-red-600 text-white px-4 py-2 rounded"
									onClick={handleDelete}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				)}

				{/* View File Modal */}
				{viewFileContent && (
					<div className="fixed inset-0 flex items-center justify-center z-50">
						<div className="fixed inset-0 bg-black opacity-50"></div>
						<div className="bg-white rounded-lg shadow-lg p-6 z-50 max-w-3xl w-full">
							<h2 className="text-xl font-bold mb-4">View Document</h2>
							<div className="mb-4">
								<div
									dangerouslySetInnerHTML={{ __html: viewFileContent }}
									className="w-full h-96 overflow-auto"
								/>
							</div>
							<div className="flex justify-end">
								<button
									className="bg-zinc-300 text-zinc-700 px-4 py-2 rounded"
									onClick={() => setViewFileContent(null)}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Documents;
