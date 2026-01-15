import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, shippers, companies } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      companyName,
      companySize,
      industry,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
      })
      .returning();

    // Create company
    const [newCompany] = await db
      .insert(companies)
      .values({
        name: companyName,
        companySize: companySize,
        industry: industry,
      })
      .returning();

    // Create shipper profile
    await db.insert(shippers).values({
      id: newUser.id,
      companyId: newCompany.id,
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || null,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
