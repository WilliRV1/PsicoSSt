import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/organisms/AppShell";
import SupportWidget from "@/components/dashboard/support-widget";

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

    return (
        <AppShell>
            {children}
            <SupportWidget />
        </AppShell>
    );
}
