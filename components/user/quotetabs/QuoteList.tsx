import React, { useState, useEffect, useCallback } from "react";
import { Database } from "@/lib/database.types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import OrderFormModal from "./OrderFormModal";
import EditQuoteModal from "./EditQuoteModal";
import QuoteDetailsMobile from "../mobile/QuoteDetailsMobile";
import {
	freightTypeMapping,
	formatDate,
	renderAdditionalDetails,
} from "./QuoteUtils";
import QuoteTable from "./QuoteTable";
import RejectReasonModal from "./RejectReasonModal";
import { set } from "react-hook-form";
import {
	generateAndUploadDocx,
	replaceShortcodes,
} from "@/components/GenerateDocx";

interface QuoteListProps {
	session: any;
	selectedUserId: string;
	isAdmin: boolean;
}

const QuoteList: React.FC<QuoteListProps> = ({ session, isAdmin }) => {
	const supabase = useSupabaseClient<Database>();
	const [quotes, setQuotes] = useState<Database["public"]["Tables"]["shippingquotes"]["Row"][]>([]);
	const [profiles, setProfiles] = useState<Database["public"]["Tables"]["profiles"]["Row"][]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
	const [quote, setQuote] = useState<Database["public"]["Tables"]["shippingquotes"]["Row"] | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [quoteToEdit, setQuoteToEdit] = useState<Database["public"]["Tables"]["shippingquotes"]["Row"] | null>(null);
	const [isRejectedModalOpen, setIsRejectedModalOpen] = useState(false);
	const [quotesToReject, setQuotesToReject] = useState<Database["public"]["Tables"]["shippingquotes"]["Row"][]>([]);
	const [expandedRow, setExpandedRow] = useState<number | null>(null);
	const [sortedQuotes, setSortedQuotes] = useState<Database["public"]["Tables"]["shippingquotes"]["Row"][]>([]);
	const [sortConfig, setSortConfig] = useState<{column: string; order: string;}>({ column: "id", order: "desc" });
	const [searchTerm, setSearchTerm] = useState("");
	const [searchColumn, setSearchColumn] = useState("id");
	const [activeTab, setActiveTab] = useState("quotes"); // Add this line
	const [editHistory, setEditHistory] = useState<Database["public"]["Tables"]["edit_history"]["Row"][]>([]);
	const [popupMessage, setPopupMessage] = useState<string | null>(null); // Add state for popup message
	const [showOrderForm, setShowOrderForm] = useState(false);
	const [errorText, setErrorText] = useState<string>("");
	const [showPriceInput, setShowPriceInput] = useState<number | null>(null);
	const [priceInput, setPriceInput] = useState<string>("");

	const user = session?.user;

	const fetchQuotes = useCallback(async () => {
		if (!user) return;

		try {
			const { data, error } = await supabase
				.from("shippingquotes")
				.select("*")
				.eq("user_id", user.id);

			if (error) {
				throw new Error(error.message);
			}

			setQuotes(data || []);
		} catch (error) {
			console.error("Error fetching quotes:", error);
		}
	}, [user, supabase]);

	useEffect(() => {
		if (user) {
			fetchQuotes();
		}
	}, [user, fetchQuotes]);

	const archiveQuote = async (quoteId: number) => {
		const { error } = await supabase
			.from("shippingquotes")
			.update({ is_archived: true })
			.eq("id", quoteId);

		if (error) {
			console.error("Error archiving quote:", error.message);
			setErrorText("Error archiving quote");
		} else {
			setQuotes((prevQuotes) =>
				prevQuotes.filter((quote) => quote.id !== quoteId)
			);
		}
	};

	const rejectedQuotes = async (quoteId: number) => {
		const { error } = await supabase
			.from("shippingquotes")
			.update({ status: "Rejected" })
			.eq("id", quoteId);

		if (error) {
			console.error("Error rejecting quote:", error.message);
			setErrorText("Error rejecting quote");
		} else {
			setQuotes((prevQuotes) =>
				prevQuotes.filter((quote) => quote.id !== quoteId)
			);
		}
	};

	const handleCreateOrderClick = (quoteId: number) => {
		const quote = quotes.find((q) => q.id === quoteId);
		if (quote) {
			setSelectedQuoteId(quote.id);
			setQuote(quote);
			setIsModalOpen(true);
		}
	};

	const fetchEditHistory = useCallback(
		async (companyId: string) => {
			const { data, error } = await supabase
				.from("edit_history")
				.select("*")
				.eq("company_id", companyId)
				.order("edited_at", { ascending: false });

			if (error) {
				console.error("Error fetching edit history:", error.message);
			} else {
				console.log("Fetched Edit History:", data);
				setEditHistory(data);
			}
		},
		[supabase]
	);

	useEffect(() => {
		const filteredAndSorted = quotes
			.filter((quote) => {
				const value = quote[searchColumn]?.toString().toLowerCase() || "";
				return value.includes(searchTerm.toLowerCase());
			})
			.sort((a, b) => {
				if (a[sortConfig.column] < b[sortConfig.column]) {
					return sortConfig.order === "asc" ? -1 : 1;
				}
				if (a[sortConfig.column] > b[sortConfig.column]) {
					return sortConfig.order === "asc" ? 1 : -1;
				}
				return 0;
			});

		setSortedQuotes(filteredAndSorted);
	}, [quotes, sortConfig, searchTerm, searchColumn]);

	const handleSort = (column: string, order: string) => {
		setSortConfig({ column, order });
	};

	const fetchProfiles = useCallback(
		async (companyId: string) => {
			const { data: profiles, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("company_id", companyId);

			if (error) {
				console.error("Error fetching profiles:", error.message);
				return [];
			}

			return profiles;
		},
		[supabase]
	);

	const fetchShippingQuotes = useCallback(
		async (profileIds: string[]) => {
			const { data: quotes, error } = await supabase
				.from("shippingquotes")
				.select("*")
				.in("user_id", profileIds)
				.eq("status", "Quote")
				.or("is_archived.is.null,is_archived.eq.false");

			if (error) {
				console.error("Error fetching shipping quotes:", error.message);
				return [];
			}

			return quotes;
		},
		[supabase]
	);

	const fetchQuotesForNtsUsers = useCallback(
		async (userId: string) => {
			const { data: companySalesUsers, error: companySalesUsersError } =
				await supabase
					.from("company_sales_users")
					.select("company_id")
					.eq("sales_user_id", userId);

			if (companySalesUsersError) {
				console.error(
					"Error fetching company_sales_users for nts_user:",
					companySalesUsersError.message
				);
				return [];
			}

			const companyIds = companySalesUsers.map(
				(companySalesUser) => companySalesUser.company_id
			);

			const { data: quotes, error: quotesError } = await supabase
				.from("shippingquotes")
				.select("*")
				.in("company_id", companyIds)
				.eq("status", "Quote")
				.or("is_archived.is.null,is_archived.eq.false");

			if (quotesError) {
				console.error(
					"Error fetching quotes for nts_user:",
					quotesError.message
				);
				return [];
			}

			return quotes;
		},
		[supabase]
	);

	const fetchInitialQuotes = useCallback(async () => {
		if (!session?.user?.id) return;

		if (isAdmin) {
			const quotesData = await fetchQuotesForNtsUsers(session.user.id);
			setQuotes(quotesData);
		} else {
			// Fetch the user's profile
			const { data: userProfile, error: userProfileError } = await supabase
				.from("profiles")
				.select("company_id")
				.eq("id", session.user.id)
				.single();

			if (userProfileError) {
				console.error("Error fetching user profile:", userProfileError.message);
				return;
			}

			if (!userProfile) {
				console.error("No profile found for user");
				return;
			}

			const companyId = userProfile.company_id;
			const profilesData = await fetchProfiles(companyId);

			setProfiles(profilesData);

			const profileIds = profilesData.map((profile) => profile.id);
			const quotesData = await fetchShippingQuotes(profileIds);

			setQuotes(quotesData);
		}
	}, [
		session,
		supabase,
		fetchProfiles,
		fetchShippingQuotes,
		fetchQuotesForNtsUsers,
		isAdmin,
	]);

	useEffect(() => {
		const channel = supabase
			.channel("shippingquotes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "shippingquotes" },
				(payload) => {
					console.log("Change received!", payload);
					fetchInitialQuotes(); // Update DOM or fetch updated data
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel); // Cleanup subscription
		};
	}, [supabase, fetchInitialQuotes]);

	useEffect(() => {
		fetchInitialQuotes();
	}, [fetchInitialQuotes]);

	const handleModalSubmit = async (data) => {
		if (selectedQuoteId !== null && session?.user?.id) {
			const { error } = await supabase
				.from("shippingquotes")
				.update({
					origin_street: data.originStreet,
					origin_name: data.originName,
					origin_phone: data.originPhone,
					destination_street: data.destinationStreet,
					destination_name: data.destinationName,
					destination_phone: data.destinationPhone,
					earliest_pickup_date: data.earliestPickupDate,
					latest_pickup_date: data.latestPickupDate,
					notes: data.notes,
					status: "Order",
				})
				.eq("id", selectedQuoteId);
	
			if (error) {
				console.error("Error updating shipping quote:", error.message);
			} else {
				// Fetch the updated quote data
				const { data: updatedQuote, error: fetchError } = await supabase
					.from("shippingquotes")
					.select("*")
					.eq("id", selectedQuoteId)
					.single();
	
				if (fetchError) {
					console.error("Error fetching updated quote:", fetchError.message);
				} else {
					// Fetch the template content
					const { data: templateData, error: templateError } = await supabase
						.from("templates")
						.select("*")
						.eq("context", "order")
						.single();
	
					if (templateError) {
						console.error("Error fetching template:", templateError.message);
					} else {
						const content = replaceShortcodes(templateData.content, { quote: updatedQuote });
						const title = templateData.title || "Order Confirmation";
						const templateId = templateData.id; // Get the template ID
	
						await generateAndUploadDocx(updatedQuote, content, title, templateId); // Pass the template ID
	
						// Save the document metadata with the template ID
						const { data: documentData, error: documentError } = await supabase
							.from("documents")
							.insert({
								user_id: session.user.id,
								title,
								description: "Order Confirmation Document",
								file_name: `${title}.docx`,
								file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
								file_url: `path/to/${title}.docx`,
								template_id: templateId, // Include the template ID
							})
							.select()
							.single();
	
						if (documentError) {
							console.error("Error saving document metadata:", documentError.message);
						} else {
							setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== selectedQuoteId));
						}
					}
				}
			}
		}
	};

	const handleRespond = async (quoteId: number) => {
		const price = prompt("Enter the price:");
		if (price === null) return;

		const { error } = await supabase
			.from("shippingquotes")
			.update({ price: parseFloat(price) })
			.eq("id", quoteId);

		if (error) {
			console.error("Error responding to quote:", error.message);
		} else {
			setQuotes((prevQuotes) =>
				prevQuotes.map((quote) =>
					quote.id === quoteId ? { ...quote, price: parseFloat(price) } : quote
				)
			);
		}
	};

	const handleEditClick = (
		quote: Database["public"]["Tables"]["shippingquotes"]["Row"]
	) => {
		setQuoteToEdit(quote);
		setIsEditModalOpen(true);
	};

	const handleRejectSubmit = async (data: {
		notes: string;
		status: string;
		quote: Database["public"]["Tables"]["shippingquotes"]["Row"];
	}) => {
		const { quote } = data;
		if (quote) {
			setSelectedQuoteId(quote.id);
			setQuote(quote);
			setIsRejectedModalOpen(false);

			const { error } = await supabase
				.from("shippingquotes")
				.update({ status: "rejected", notes: data.notes })
				.eq("id", quote.id);

			if (error) {
				console.error("Error rejecting quote:", error.message);
			} else {
				setQuotes((prevQuotes) => prevQuotes.filter((q) => q.id !== quote.id));
			}
		}
	};

	const handleRejectClick = (id: number) => {
		const quote = quotes.find((q) => q.id === id);
		if (quote) {
			setQuotesToReject([quote]);
			setQuote(quote);
			setIsRejectedModalOpen(true);
		}
	};

	const handleEditModalSubmit = async (
		updatedQuote: Database["public"]["Tables"]["shippingquotes"]["Row"]
	) => {
		if (quoteToEdit && session?.user?.id) {
			const { data: originalQuote, error: fetchError } = await supabase
				.from("shippingquotes")
				.select("*")
				.eq("id", quoteToEdit.id)
				.single();

			if (fetchError) {
				console.error("Error fetching original quote:", fetchError.message);
				return;
			}

			const { error: updateError } = await supabase
				.from("shippingquotes")
				.update(updatedQuote)
				.eq("id", quoteToEdit.id);

			if (updateError) {
				console.error("Error updating quote:", updateError.message);
				return;
			}

			const changes = Object.keys(updatedQuote).reduce((acc, key) => {
				if (updatedQuote[key] !== originalQuote[key]) {
					acc[key] = { old: originalQuote[key], new: updatedQuote[key] };
				}
				return acc;
			}, {});

			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("company_id")
				.eq("id", session.user.id)
				.single();

			if (profileError) {
				console.error("Error fetching profile:", profileError.message);
				return;
			}

			const { error: historyError } = await supabase
				.from("edit_history")
				.insert({
					quote_id: quoteToEdit.id,
					edited_by: session.user.id,
					changes: JSON.stringify(changes),
					company_id: profile.company_id, // Ensure company_id is set
				});

			if (historyError) {
				console.error("Error logging edit history:", historyError.message);
			} else {
				setQuotes((prevQuotes) =>
					prevQuotes.map((quote) =>
						quote.id === updatedQuote.id ? updatedQuote : quote
					)
				);
			}
		}
		setIsEditModalOpen(false);
	};

	const handleRowClick = (id: number) => {
		setExpandedRow(expandedRow === id ? null : id);
	};

	const duplicateQuote = async (
		quote: Database["public"]["Tables"]["shippingquotes"]["Row"]
	) => {
		const { data, error } = await supabase
			.from("shippingquotes")
			.insert({
				...quote,
				id: undefined, // Let the database generate a new ID
				due_date: null, // Require the user to fill out a new shipping date
			})
			.select();

		if (error) {
			console.error("Error duplicating quote:", error.message);
		} else {
			if (data && data.length > 0) {
				setPopupMessage(`Duplicate Quote Request Added - Quote #${data[0].id}`);
			}
			fetchInitialQuotes();
		}
	};

	const reverseQuote = async (
		quote: Database["public"]["Tables"]["shippingquotes"]["Row"]
	) => {
		const { data, error } = await supabase
			.from("shippingquotes")
			.insert({
				...quote,
				id: undefined, // Let the database generate a new ID
				due_date: null, // Require the user to fill out a new shipping date
				origin_city: quote.destination_city,
				origin_state: quote.destination_state,
				origin_zip: quote.destination_zip,
				destination_city: quote.origin_city,
				destination_state: quote.origin_state,
				destination_zip: quote.origin_zip,
			})
			.select();

		if (error) {
			console.error("Error reversing quote:", error.message);
		} else {
			if (data && data.length > 0) {
				setPopupMessage(
					`Flip Route Duplicate Request Added - Quote #${data[0].id}`
				);
			}
			fetchInitialQuotes();
		}
	};

	useEffect(() => {
		if (popupMessage) {
			const timer = setTimeout(() => {
				setPopupMessage(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [popupMessage]);

	const getStatusClasses = (status: string) => {
		switch (status) {
			case "In Progress":
				return "bg-blue-50 text-blue-700";
			case "Need More Info":
				return "bg-amber-50 text-amber-700";
			case "Priced":
				return "bg-green-50 text-green-700";
			case "Cancelled":
				return "bg-red-50 text-red-700";
			default:
				return "bg-gray-50 text-gray-700";
		}
	};

	const handleStatusChange = async (
		e: React.ChangeEvent<HTMLSelectElement>,
		quoteId: number
	) => {
		const newStatus = e.target.value;

		// Update the status in the database
		const { error } = await supabase
			.from("shippingquotes")
			.update({ brokers_status: newStatus })
			.eq("id", quoteId);

		if (error) {
			console.error("Error updating status:", error.message);
		}
	};

	return (
		<div className="w-full bg-white max-h-max flex-grow">
			{popupMessage && (
				<div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
					{popupMessage}
				</div>
			)}
			<OrderFormModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleModalSubmit}
				quote={quote}
			/>
			<RejectReasonModal
				isOpen={isRejectedModalOpen}
				onClose={() => setIsRejectedModalOpen(false)}
				onSubmit={handleRejectSubmit}
				quote={quote}
			/>
			<EditQuoteModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onSubmit={handleEditModalSubmit}
				quote={quoteToEdit}
			/>
			<div className="hidden lg:block overflow-x-auto">
				<QuoteTable
					sortConfig={sortConfig}
					handleSort={handleSort}
					quotes={sortedQuotes}
					setActiveTab={setActiveTab}
					activeTab={activeTab}
					editHistory={editHistory}
					expandedRow={expandedRow}
					handleRowClick={handleRowClick}
					archiveQuote={archiveQuote}
					handleEditClick={handleEditClick}
					duplicateQuote={duplicateQuote}
					reverseQuote={reverseQuote}
					quoteToEdit={quoteToEdit}
					quote={quote}
					companyId={session?.user?.id}
					fetchEditHistory={fetchEditHistory}
					handleCreateOrderClick={handleCreateOrderClick}
					handleRespond={handleRespond}
					isAdmin={isAdmin}
					handleRejectClick={handleRejectClick}
				/>
			</div>
			<div className="block md:hidden">
				<QuoteDetailsMobile
					quotes={quotes}
					handleStatusChange={handleStatusChange}
					getStatusClasses={getStatusClasses}
					formatDate={formatDate}
					archiveQuote={archiveQuote}
					handleEditClick={handleEditClick}
					handleCreateOrderClick={handleCreateOrderClick}
					handleRespond={handleRespond}
					isAdmin={isAdmin} // Replace with actual isAdmin value
					setShowPriceInput={setShowPriceInput}
					showPriceInput={showPriceInput}
					priceInput={priceInput}
					setPriceInput={setPriceInput}
					handleRejectClick={handleRejectClick}
				/>
			</div>
		</div>
	);
};

export default QuoteList;
