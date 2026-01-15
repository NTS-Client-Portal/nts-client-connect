import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes, shippers, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.userType !== "shipper") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      originCity,
      originState,
      originZip,
      destinationCity,
      destinationState,
      destinationZip,
      freightType,
      pickupDate,
      dueDate,
      notes,
      specialInstructions,
    } = body;

    // Get shipper's company
    const [shipper] = await db
      .select()
      .from(shippers)
      .where(eq(shippers.id, session.user.id))
      .limit(1);

    if (!shipper) {
      return NextResponse.json({ error: "Shipper not found" }, { status: 404 });
    }

    // Get company's assigned broker
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, shipper.companyId))
      .limit(1);

    // Create quote
    const [newQuote] = await db
      .insert(quotes)
      .values({
        shipperId: session.user.id,
        companyId: shipper.companyId,
        assignedBrokerId: company?.assignedBrokerId || null,
        originCity,
        originState,
        originZip,
        destinationCity,
        destinationState,
        destinationZip,
        freightType,
        pickupDate: pickupDate || null,
        dueDate: dueDate || null,
        notes: notes || null,
        specialInstructions: specialInstructions || null,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      quoteId: newQuote.id,
    });
  } catch (error) {
    console.error("Create quote error:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isNtsUser = session.user.userType === "nts_user";
    const userId = session.user.id;

    // Get quotes based on user type
    const userQuotes = isNtsUser
      ? await db.select().from(quotes).limit(50)
      : await db
          .select()
          .from(quotes)
          .where(eq(quotes.shipperId, userId));

    return NextResponse.json({ quotes: userQuotes });
  } catch (error) {
    console.error("Get quotes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
