import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
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
        <DashboardShell
            user={{
                fullName: session.user.fullName,
                licenseNumber: session.user.licenseNumber,
                isAdmin: session.user.isAdmin,
            }}
        >
            {children}
            <SupportWidget />
        </DashboardShell>
    );
}
