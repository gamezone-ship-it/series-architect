import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    
    // This prints the email to your Vercel "Runtime Logs"
    console.log("🚨 NEW LEAD CAPTURED 🚨");
    console.log("Email:", data.email);
    console.log("Interest:", data.game);
    console.log("Timestamp:", new Date().toISOString());
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}