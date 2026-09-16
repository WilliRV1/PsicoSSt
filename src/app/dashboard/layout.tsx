import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/organisms/AppShell";
import SupportWidget from "@/components/dashboard/support-widget";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.status === "PENDING") {
        redirect("/pending-approval");
    }

    if (session.user.mfaEnabled && !session.user.mfaVerified) {
        redirect("/mfa-verify");
    }

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, email: true, creditBalance: true }
    });

    // isAdmin ya viene en la sesión (JWT), no hace falta otra consulta: es lo
    // que decide si la barra lateral muestra la sección de Administración.
    const user = psychologist ? { ...psychologist, isAdmin: session.user.isAdmin } : null;

    return (
        <AppShell user={user}>
            {children}
            <SupportWidget />
        </AppShell>
    );
}
