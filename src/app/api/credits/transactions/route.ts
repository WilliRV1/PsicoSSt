import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CreditService } from "@/lib/services/credit-service";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
        const offset = parseInt(searchParams.get("offset") || "0");

        const transactions = await CreditService.getTransactions(
            session.user.id,
            limit,
            offset
        );

        return NextResponse.json({ data: transactions });
    } catch (error) {
        console.error("[CREDITS] Transactions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
