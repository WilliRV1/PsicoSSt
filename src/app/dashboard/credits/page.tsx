import { redirect } from "next/navigation";

// La ruta se conserva porque el checkout de pagos vive en /dashboard/credits/checkout/[ref].
export default function CreditsPage() {
    redirect("/dashboard/plan");
}
