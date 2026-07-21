import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/organisms/AppShell";
import SupportWidget from "@/components/dashboard/support-widget";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    try {
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
    } catch(e: any) {
        if (e.message === 'NEXT_REDIRECT') throw e;
        return (<div className='p-10 text-red-500 font-bold text-xl'><h1>Layout Error:</h1><pre>{e.message}</pre><pre>{e.stack}</pre></div>);
    }
}
