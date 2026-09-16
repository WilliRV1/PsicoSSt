import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Le dice a la pantalla de verificación qué método usar (TOTP no necesita
 * nada del servidor; EMAIL sí, para saber que debe pedir el envío del código).
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ mfaMethod: session.user.mfaMethod ?? "TOTP" });
}
