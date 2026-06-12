import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreditService } from "@/lib/services/credit-service";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const balance = await CreditService.getBalance(session.user.id);
        return NextResponse.json({ balance });
    } catch (error) {
        console.error("[CREDITS] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
