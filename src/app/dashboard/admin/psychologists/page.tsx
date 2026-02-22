import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { PsychologistList } from "./psychologist-list";

export default async function AdminPsychologistsPage() {
    const session = await auth();

    // Protection: Auth + Admin check
    if (!session?.user || !session.user.isAdmin) {
        redirect("/dashboard");
    }

    return (
        <div className="dashboard">
            <nav className="nav">
                <div className="nav-brand">
                    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="10" fill="url(#grad)" />
                        <path d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M20 16V24M16 20H24" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                                <stop stopColor="#6366f1" />
                                <stop offset="1" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="nav-title">PsicoSST</span>
                </div>

                <div className="nav-links">
                    <Link href="/dashboard" className="nav-link">Dashboard</Link>
                    <Link href="/dashboard/admin/psychologists" className="nav-link active">Administración</Link>
                </div>

                <div className="nav-user">
                    <div className="nav-user-info">
                        <span className="nav-user-name">{session.user.fullName}</span>
                        <span className="nav-user-license">{session.user.licenseNumber}</span>
                    </div>
                    <SignOutButton />
                </div>
            </nav>

            <main className="main">
                <header className="header">
                    <h1>Administración de Psicólogos</h1>
                    <p>Gestiona el acceso, aprueba registros y supervisa el estado de los profesionales.</p>
                </header>

                <PsychologistList />
            </main>

            <style>{`
        .dashboard { min-height: 100vh; background: #0f0f23; color: #e2e8f0; }
        .nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid rgba(99,102,241,0.1); background: rgba(15,15,35,0.8); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10; }
        .nav-brand { display: flex; align-items: center; gap: 0.75rem; }
        .nav-title { font-size: 1.125rem; font-weight: 700; color: #f1f5f9; }
        .nav-links { display: flex; gap: 1.5rem; }
        .nav-link { font-size: 0.875rem; font-weight: 500; color: #94a3b8; text-decoration: none; transition: color 0.2s; position: relative; padding: 0.25rem 0; }
        .nav-link:hover { color: #818cf8; }
        .nav-link.active { color: #f1f5f9; }
        .nav-link.active::after { content: ''; position: absolute; bottom: -1rem; left: 0; right: 0; height: 2px; background: #6366f1; box-shadow: 0 0 10px rgba(99,102,241,0.5); }
        .nav-user { display: flex; align-items: center; gap: 1rem; }
        .nav-user-info { text-align: right; }
        .nav-user-name { display: block; font-size: 0.875rem; font-weight: 500; color: #e2e8f0; }
        .nav-user-license { display: block; font-size: 0.75rem; color: #64748b; }
        .main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
        .header p { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
      `}</style>
        </div>
    );
}
