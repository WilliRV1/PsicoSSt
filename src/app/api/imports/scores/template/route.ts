import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isInstrumentId } from "@/config/instruments";
import { csvTemplate } from "@/lib/services/score-import-service";

/** GET ?instrument=INTRALABORAL&formType=A → plantilla CSV descargable. */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instrument = request.nextUrl.searchParams.get("instrument") ?? "";
    const formRaw = (request.nextUrl.searchParams.get("formType") ?? "A").toUpperCase();
    if (!isInstrumentId(instrument)) {
        return NextResponse.json({ error: "instrument inválido" }, { status: 400 });
    }
    const formType = formRaw === "B" ? "B" : "A";

    const csv = csvTemplate(instrument, formType);
    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="plantilla-${instrument.toLowerCase()}-${formType}.csv"`,
        },
    });
}
