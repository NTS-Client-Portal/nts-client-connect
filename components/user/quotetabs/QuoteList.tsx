import React, { useState, useEffect, useCallback } from "react";
import { Database } from "@/lib/database.types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { 
    QuoteStatus, 
    BrokersStatus,
    QUOTE_STATUS_LABELS,
    BROKERS_STATUS_LABELS,
    getStatusLabel,
    getStatusStyle
} from "@/lib/statusManagement";
import OrderFormModal from "./OrderFormModal";
import EditQuoteModal from "./EditQuoteModal";
import QuoteDetailsMobile from "../mobile/QuoteDetailsMobile";
import { freightTypeMapping, formatDate, renderAdditionalDetails } from "./QuoteUtils";
import QuoteTable from "./QuoteTable";
import RejectReasonModal from "./RejectReasonModal";
import { generateAndUploadDocx, replaceShortcodes } from "@/components/GenerateDocx";
import EditRequestManager from "@/components/admin/EditRequestManager";

interface QuoteListProps {
    session: any;
    selectedUserId: string;
    isAdmin: boolean;
    fetchQuotes: () => void;
    companyId: string; // Add companyId as a prop
    isUser: boolean;
}

const QuoteList: React.FC<QuoteListProps> = ({ session, isAdmin, fetchQuotes, companyId, isUser }) => {
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
    const [sortConfig, setSortConfig] = useState<{ column: string; order: string; }>({ column: "id", order: "desc" });
    const [searchTerm, setSearchTerm] = useState("");
    const [searchColumn, setSearchColumn] = useState("id");
    const [activeTab, setActiveTab] = useState("quotes"); // Add this line
    const [editHistory, setEditHistory] = useState<Database["public"]["Tables"]["edit_history"]["Row"][]>([]);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [errorText, setErrorText] = useState<string>("");
    const [showPriceInput, setShowPriceInput] = useState<number | null>(null);
    const [priceInput, setPriceInput] = useState<string>("");
    const [showEditRequests, setShowEditRequests] = useState(false);

    const user = session?.user;

    const archiveQuote = async (quoteId: number) => {
        const { error } = await supabase
            .from("shippingquotes")
            .update({ is_archived: true, status: "Archived" })
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
            console.log('Fetching edit history for companyId:', companyId); // Add log to check companyId

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
            console.log('Fetching profiles for companyId:', companyId); // Add log to check companyId

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
            const { data: allQuotes, error } = await supabase
                .from("shippingquotes")
                .select("*")
                .in("user_id", profileIds)
                .or("is_archived.is.null,is_archived.eq.false");

            if (error) {
                console.error("Error fetching shipping quotes:", error.message);
                return [];
            }

            // Filter for quotes with case-insensitive status check
            const quotes = allQuotes?.filter(quote => {
                const status = quote.status?.toLowerCase() || '';
                return (status === "quote" || status === "pending" || status === '' || quote.status === null);
            }) || [];

            return quotes;
        },
        [supabase]
    );

    const fetchQuotesForNtsUsers = useCallback(
        async (userId: string, companyId: string) => {
            console.log('Fetching quotes for nts_user with companyId:', companyId); // Add log to check companyId

            const { data: companySalesUsers, error: companySalesUsersError } = await supabase
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

            if (!companyIds.includes(companyId)) {
                console.error("Company ID not assigned to the user");
                return [];
            }

            // DEBUGGING: Fetch ALL quotes for this company AND orphaned quotes (company_id = null)
            const { data: allQuotes, error: allQuotesError } = await supabase
                .from("shippingquotes")
                .select("*")
                .or(`company_id.eq.${companyId},company_id.is.null`)
                .order('created_at', { ascending: false });

            if (allQuotesError) {
                console.error("Error fetching all quotes:", allQuotesError.message);
                return [];
            }

            console.log('ALL quotes for company + orphaned:', allQuotes);
            console.log('Quotes by status:', allQuotes?.reduce((acc, q) => {
                acc[q.status] = (acc[q.status] || 0) + 1;
                return acc;
            }, {}));

            // Filter for quotes that NTS users should see (more inclusive, case-insensitive)
            // Include orphaned quotes (company_id = null) so NTS users can see and fix them
            const filteredQuotes = allQuotes?.filter(quote => {
                const status = quote.status?.toLowerCase() || '';
                return (
                    (status === "quote" || status === "pending" || status === '' || quote.status === null) &&
                    (quote.is_archived !== true)
                );
            }) || [];

            console.log('Filtered quotes for NTS user (including orphaned):', filteredQuotes);
            return filteredQuotes;
        },
        [supabase]
    );

    const fetchInitialQuotes = useCallback(async () => {
        if (!session?.user?.id) return;

        if (isAdmin) {
            const quotesData = await fetchQuotesForNtsUsers(session.user.id, companyId);
            setQuotes(quotesData);
        } else if (isUser) {
            // For shippers, fetch the user's profile from profiles table
            const { data: userProfile, error: userProfileError } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", session.user.id)
                .single();

            if (userProfileError) {
                console.error("Error fetching user profile from profiles:", userProfileError.message);
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
        } else {
            // For sales reps, fetch from nts_users table and use the passed companyId
            const quotesData = await fetchQuotesForNtsUsers(session.user.id, companyId);
            setQuotes(quotesData);
        }
    }, [
        session,
        supabase,
        fetchProfiles,
        fetchShippingQuotes,
        fetchQuotesForNtsUsers,
        isAdmin,
        isUser,
        companyId,
    ]);

    useEffect(() => {
        const channel = supabase
            .channel("shippingquotes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "shippingquotes" },
                (payload) => {
                    console.log("Real-time change received!", payload);
                    console.log("Event type:", payload.eventType);
                    console.log("New data:", payload.new);
                    console.log("Old data:", payload.old);
                    
                    // Check if this change is relevant to the current company
                    const newData = payload.new as any;
                    if (newData && newData.company_id === companyId) {
                        console.log("Change is relevant to current company, refreshing quotes...");
                        fetchInitialQuotes(); // Update DOM or fetch updated data
                    } else {
                        console.log("Change not relevant to current company");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // Cleanup subscription
        };
    }, [supabase, fetchInitialQuotes, companyId]);

    useEffect(() => {
        fetchInitialQuotes();
    }, [fetchInitialQuotes]);

    interface ModalSubmitData {
        originStreet: string;
        originName: string;
        originPhone: string;
        destinationStreet: string;
        destinationName: string;
        destinationPhone: string;
        earliestPickupDate: string;
        latestPickupDate: string;
        notes: string;
    }

    const handleModalSubmit = async (data: ModalSubmitData) => {
        if (selectedQuoteId !== null && session?.user?.id) {
            // STEP 1: Convert quote to order (CRITICAL - must succeed)
            console.log('🔄 Converting quote to order...');
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
                    brokers_status: "In Progress",
                    status: "Order",
                })
                .eq("id", selectedQuoteId);

            if (error) {
                console.error("❌ Error converting quote to order:", error.message);
                alert("Failed to create order. Please try again.");
                return; // Stop here if order creation fails
            }

            console.log('✅ Order created successfully!');
            
            // STEP 2: Update UI immediately (don't wait for notifications/emails)
            setQuotes((prevQuotes) => prevQuotes.filter((quote) => quote.id !== selectedQuoteId));
            setIsModalOpen(false);

            // STEP 3: Fetch the updated order data for notifications (non-blocking)
            const { data: updatedQuote, error: fetchError } = await supabase
                .from("shippingquotes")
                .select("*")
                .eq("id", selectedQuoteId)
                .single();

            if (fetchError) {
                console.error("Error fetching updated order:", fetchError.message);
                // Continue anyway - order was created successfully
            } else {
                    // Send notification to assigned broker(s)
                    if (updatedQuote.company_id) {
                        // Fetch all sales users assigned to this company
                        const { data: assignedSalesUsers, error: salesUsersError } = await supabase
                            .from("company_sales_users")
                            .select("sales_user_id")
                            .eq("company_id", updatedQuote.company_id);

                        if (salesUsersError) {
                            console.error("Error fetching assigned sales users:", salesUsersError.message);
                        } else if (assignedSalesUsers && assignedSalesUsers.length > 0) {
                            // Fetch broker email addresses
                            const { data: brokers, error: brokersError } = await supabase
                                .from("nts_users")
                                .select("id, email, first_name, last_name")
                                .in("id", assignedSalesUsers.map(u => u.sales_user_id));

                            if (brokersError) {
                                console.error("Error fetching broker details:", brokersError.message);
                            }

                            // Send notification to all assigned brokers
                            const notifications = assignedSalesUsers.map(({ sales_user_id }) => ({
                                nts_user_id: sales_user_id,
                                message: `New order #${updatedQuote.id} has been created from a quote. Origin: ${updatedQuote.origin_city}, ${updatedQuote.origin_state} → Destination: ${updatedQuote.destination_city}, ${updatedQuote.destination_state}`,
                                created_at: new Date().toISOString(),
                            }));

                            const { error: notificationError } = await supabase
                                .from("notifications")
                                .insert(notifications);

                            if (notificationError) {
                                console.error("Error sending notifications to brokers:", notificationError.message);
                            } else {
                                console.log(`Notifications sent to ${assignedSalesUsers.length} broker(s)`);
                            }

                            // Send email notifications to brokers
                            if (brokers && brokers.length > 0) {
                                try {
                                    console.log(`Attempting to send emails to ${brokers.length} broker(s)...`);
                                    const emailPromises = brokers.map(async (broker) => {
                                        try {
                                            console.log(`Sending email to ${broker.email}...`);
                                            const response = await fetch('/.netlify/functions/sendEmail', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    to: broker.email,
                                                    subject: `New Order #${updatedQuote.id} Created`,
                                                    html: `
                                                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                                            <h2 style="color: #2563eb;">New Order Created</h2>
                                                            <p>Hello ${broker.first_name || 'there'},</p>
                                                            <p>A new order has been created from a quote:</p>
                                                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                                                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${updatedQuote.id}</p>
                                                                <p style="margin: 5px 0;"><strong>Origin:</strong> ${updatedQuote.origin_city}, ${updatedQuote.origin_state}</p>
                                                                <p style="margin: 5px 0;"><strong>Destination:</strong> ${updatedQuote.destination_city}, ${updatedQuote.destination_state}</p>
                                                                <p style="margin: 5px 0;"><strong>Freight Type:</strong> ${updatedQuote.freight_type}</p>
                                                                ${updatedQuote.earliest_pickup_date ? `<p style="margin: 5px 0;"><strong>Pickup Date:</strong> ${updatedQuote.earliest_pickup_date}</p>` : ''}
                                                            </div>
                                                            <p style="margin-bottom: 20px;">Please review the order details and update the status as needed.</p>
                                                            
                                                            <div style="text-align: center; margin: 30px 0;">
                                                                <a href="https://www.shipper-connect.com/companies/${updatedQuote.company_id}" 
                                                                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                                                    View Company Dashboard →
                                                                </a>
                                                            </div>
                                                            
                                                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                                                            <p style="color: #6b7280; font-size: 14px;">
                                                                Best regards,<br>
                                                                NTS Logistics Team
                                                            </p>
                                                        </div>
                                                    `,
                                                    text: `New Order #${updatedQuote.id} Created\n\nA new order has been created from a quote.\n\nOrder ID: #${updatedQuote.id}\nOrigin: ${updatedQuote.origin_city}, ${updatedQuote.origin_state}\nDestination: ${updatedQuote.destination_city}, ${updatedQuote.destination_state}\nFreight Type: ${updatedQuote.freight_type}\n\nView company dashboard: https://www.shipper-connect.com/companies/${updatedQuote.company_id}`,
                                                }),
                                            });
                                            
                                            if (!response.ok) {
                                                const errorText = await response.text();
                                                console.error(`Failed to send email to ${broker.email}. Status: ${response.status}, Error: ${errorText}`);
                                                return { success: false, email: broker.email, error: errorText };
                                            }
                                            
                                            const result = await response.json();
                                            console.log(`Email sent successfully to ${broker.email}:`, result);
                                            return { success: true, email: broker.email };
                                        } catch (error) {
                                            console.error(`Exception sending email to ${broker.email}:`, error);
                                            return { success: false, email: broker.email, error: String(error) };
                                        }
                                    });

                                    const results = await Promise.all(emailPromises);
                                    const successCount = results.filter(r => r.success).length;
                                    const failCount = results.filter(r => !r.success).length;
                                    
                                    console.log(`Email notification results: ${successCount} succeeded, ${failCount} failed`);
                                    if (failCount > 0) {
                                        const failedEmails = results.filter(r => !r.success).map(r => r.email).join(', ');
                                        console.error(`Failed to send emails to: ${failedEmails}`);
                                    }
                                } catch (emailError) {
                                    console.error("⚠️ Error sending email notifications (non-critical):", emailError);
                                }
                            }
                        }
                    }

                    // STEP 4: Generate document (optional - don't block on this)
                    try {
                        const { data: templateData, error: templateError } = await supabase
                            .from("templates")
                            .select("*")
                            .eq("context", "order")
                            .maybeSingle();

                        if (templateError) {
                            console.error("⚠️ Error fetching template (non-critical):", templateError.message);
                        } else if (!templateData) {
                            console.warn("⚠️ No order template found in database. Skipping document generation.");
                        } else {
                            const content = replaceShortcodes(templateData.content, { quote: updatedQuote });
                            const title = templateData.title || "Order Confirmation";
                            const templateId = templateData.id;

                            await generateAndUploadDocx(updatedQuote, content, title, templateId);

                            // Save the document metadata
                            const { error: documentError } = await supabase
                                .from("documents")
                                .insert({
                                    user_id: session.user.id,
                                    title,
                                    description: "Order Confirmation Document",
                                    file_name: `${title}.docx`,
                                    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                    file_url: `path/to/${title}.docx`,
                                    template_id: templateId,
                                });

                            if (documentError) {
                                console.error("⚠️ Error saving document metadata (non-critical):", documentError.message);
                            } else {
                                console.log("✅ Order document generated successfully");
                            }
                        }
                    } catch (docError) {
                        console.error("⚠️ Error generating document (non-critical):", docError);
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
                .update({ status: "Rejected", notes: data.notes })
                .eq("id", quote.id);

            if (error) {
                console.error("Error rejecting quote:", error.message);
            } else {
                setQuotes((prevQuotes) => prevQuotes.filter((q) => q.id !== quote.id));
                // Refresh quotes to update all tabs including rejected
                fetchQuotes();
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

            const { data: profile, error: profileError } = isUser
                ? await supabase
                    .from("profiles")
                    .select("company_id")
                    .eq("id", session.user.id)
                    .single()
                : await supabase
                    .from("nts_users")
                    .select("company_id")
                    .eq("id", session.user.id)
                    .single();

            if (profileError) {
                console.error(`Error fetching profile from ${isUser ? 'profiles' : 'nts_users'}:`, profileError.message);
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
        // Implement failsafe system: preserve or failsafe company_id
        let finalCompanyId: string | null = quote.company_id || companyId || null;
        
        // If no company_id available, allow duplication but flag for admin review
        if (!finalCompanyId) {
            console.warn('⚠️ Duplicate quote being created without company_id - will need admin review');
        }

        const { data, error } = await supabase
            .from("shippingquotes")
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                company_id: finalCompanyId, // Use failsafe company_id
                due_date: null,
                price: null,
                status: "quote", // Always set status to quote for duplicates
                created_at: new Date().toISOString(), // Set the current timestamp
                needs_admin_review: !finalCompanyId, // Flag for admin review if needed
            })
            .select();

        if (error) {
            console.error("Error duplicating quote:", error.message);
        } else {
            if (data && data.length > 0) {
                // If quote was saved without company_id, log critical alert
                if (!finalCompanyId) {
                    console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                        message: 'Duplicate quote created without company assignment from QuoteList',
                        quote_id: data[0].id,
                        original_quote_id: quote.id,
                        timestamp: new Date().toISOString(),
                        action_required: 'Admin needs to assign company_id to this duplicate quote ASAP'
                    });
                }
                setPopupMessage(`Duplicate Quote Request Added - Quote #${data[0].id}`);
            }
            fetchInitialQuotes();
        }
    };

    const reverseQuote = async (
        quote: Database["public"]["Tables"]["shippingquotes"]["Row"]
    ) => {
        // Implement failsafe system: preserve or failsafe company_id
        let finalCompanyId: string | null = quote.company_id || companyId || null;
        
        // If no company_id available, allow reverse but flag for admin review
        if (!finalCompanyId) {
            console.warn('⚠️ Reverse quote being created without company_id - will need admin review');
        }

        const { data, error } = await supabase
            .from("shippingquotes")
            .insert({
                ...quote,
                id: undefined, // Let the database generate a new ID
                company_id: finalCompanyId, // Use failsafe company_id
                due_date: null, // Require the user to fill out a new shipping date
                status: "quote", // Always set status to quote for reversed quotes
                origin_city: quote.destination_city,
                origin_state: quote.destination_state,
                origin_zip: quote.destination_zip,
                destination_city: quote.origin_city,
                destination_state: quote.origin_state,
                destination_zip: quote.origin_zip,
                created_at: new Date().toISOString(), // Set the current timestamp
                needs_admin_review: !finalCompanyId, // Flag for admin review if needed
            })
            .select();

        if (error) {
            console.error("Error reversing quote:", error.message);
        } else {
            if (data && data.length > 0) {
                // If quote was saved without company_id, log critical alert
                if (!finalCompanyId) {
                    console.error('🚨🚨🚨 MANUAL REVIEW NEEDED 🚨🚨🚨', {
                        message: 'Reverse quote created without company assignment from QuoteList',
                        quote_id: data[0].id,
                        original_quote_id: quote.id,
                        timestamp: new Date().toISOString(),
                        action_required: 'Admin needs to assign company_id to this reverse quote ASAP'
                    });
                }
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
        // Use the new status management system for consistent styling
        return getStatusStyle(status as BrokersStatus);
    };

    const handleStatusChange = async (
        e: React.ChangeEvent<HTMLSelectElement>,
        quoteId: number
    ) => {
        const newStatus = e.target.value as BrokersStatus;

        // Update the status in the database with audit trail
        const { error } = await supabase
            .from("shippingquotes")
            .update({ 
                brokers_status: newStatus,
                updated_by: session?.user?.id  // Track who made the change
            })
            .eq("id", quoteId);

        if (error) {
            console.error("Error updating status:", error.message);
        }
    };

    return (
        <div className="w-full bg-white max-h-max flex-grow overflow-hidden">
            {popupMessage && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out z-50">
                    {popupMessage}
                </div>
            )}
            
            {/* Header with Edit Requests toggle for NTS users */}
            {isAdmin && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {showEditRequests ? 'Edit Requests' : 'Quotes'}
                        </h2>
                        <button
                            onClick={() => setShowEditRequests(!showEditRequests)}
                            className={`px-4 py-2 rounded transition-colors ${
                                showEditRequests
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            {showEditRequests ? 'View Quotes' : 'View Edit Requests'}
                        </button>
                    </div>
                </div>
            )}

            {/* Show Edit Requests Manager for NTS users when toggled */}
            {showEditRequests && isAdmin ? (
                <div className="p-4">
                    <EditRequestManager
                        session={session}
                        companyId={companyId}
                        isAdmin={isAdmin}
                    />
                </div>
            ) : (
                <>
                    {/* Regular quote management UI */}
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
                        isAdmin={isAdmin}
                        session={session}
                        companyId={companyId}
                    />
                    <div className="hidden xl:block">
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
                            isUser={isUser}
                        />
                    </div>
                    <div className="block xl:hidden">
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
                            isUser={isUser}
                            setShowPriceInput={setShowPriceInput}
                            showPriceInput={showPriceInput}
                            priceInput={priceInput}
                            setPriceInput={setPriceInput}
                            handleRejectClick={handleRejectClick}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default QuoteList;
