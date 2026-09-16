import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Landing from "./(marketing)/landing";

/**
 * Raíz: con sesión va al panel; sin sesión muestra la landing.
 *
 * Antes redirigía siempre a /dashboard, de modo que el proxy devolvía a
 * /login y el producto no tenía una página pública que explicara qué es ni
 * cuánto cuesta.
 */
export default async function Home() {
    const session = await auth();
    if (session?.user?.id) redirect("/dashboard");
    return <Landing />;
}
