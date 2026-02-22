import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // If user is pending, redirect
    if (session.user.status === "PENDING") {
        redirect("/pending-approval");
    }

    // Fetch real stats
    const psychId = session.user.id;
    const [orgCount, workerCount, assessmentCount, reportCount] = await Promise.all([
        prisma.organization.count({ where: { createdByPsychologist: psychId } }),
        prisma.worker.count({ where: { organization: { createdByPsychologist: psychId } } }),
        prisma.assessment.count({ where: { psychologistId: psychId } }),
        prisma.report.count({ where: { psychologistId: psychId } })
    ]);

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
                    <Link href="/dashboard" className="nav-link active">Dashboard</Link>
                    <Link href="/dashboard/organizations" className="nav-link">Empresas</Link>
                    <Link href="/dashboard/assessments" className="nav-link">Evaluaciones</Link>
                    <Link href="/dashboard/profile" className="nav-link">Mi Perfil</Link>
                    {session.user.isAdmin && (
                        <Link href="/dashboard/admin/psychologists" className="nav-link">Administración</Link>
                    )}
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
                <div className="welcome">
                    <h1>Bienvenido, {session.user.fullName.split(" ")[0]}</h1>
                    <p>Panel de administración de evaluaciones psicosociales</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-value">{assessmentCount}</div>
                        <div className="stat-label">Evaluaciones</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-value">{orgCount}</div>
                        <div className="stat-label">Organizaciones</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{workerCount}</div>
                        <div className="stat-label">Trabajadores</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📄</div>
                        <div className="stat-value">{reportCount}</div>
                        <div className="stat-label">Informes</div>
                    </div>
                </div>

                <div className="quick-actions">
                    <h2 className="section-title">Acciones Rápidas</h2>
                    <div className="action-grid">
                        <Link href="/dashboard/assessments/new/manual" className="action-card">
                            <div className="action-icon">✍️</div>
                            <h3>Digitalizar Papel</h3>
                            <p>Transcripción manual (0-4) para encuestas físicas.</p>
                        </Link>
                        <Link href="/dashboard/assessments/bulk" className="action-card">
                            <div className="action-icon">📊</div>
                            <h3>Carga Masiva</h3>
                            <p>Importar múltiples resultados desde Excel o CSV.</p>
                        </Link>
                        <Link href="/dashboard/assessments" className="action-card">
                            <div className="action-icon">📄</div>
                            <h3>Ver Informes</h3>
                            <p>Consultar evaluaciones completadas y generar informes PDF.</p>
                        </Link>
                        <Link href="/dashboard/organizations" className="action-card">
                            <div className="action-icon">🏢</div>
                            <h3>Mis Empresas</h3>
                            <p>Gestionar organizaciones y agregar trabajadores.</p>
                        </Link>
                    </div>
                </div>
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
        .welcome h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
        .welcome p { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: rgba(30,30,60,0.6); border: 1px solid rgba(99,102,241,0.1); border-radius: 12px; padding: 1.25rem; text-align: center; transition: border-color 0.2s; }
        .stat-card:hover { border-color: rgba(99,102,241,0.3); }
        .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.75rem; font-weight: 700; color: #f1f5f9; }
        .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
        .section-title { font-size: 1rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
        .quick-actions { margin-top: 2rem; }
        .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .action-card { background: rgba(30,30,60,0.4); border: 1px solid rgba(99,102,241,0.1); border-radius: 16px; padding: 2rem; text-decoration: none; color: inherit; transition: all 0.2s; cursor: pointer; }
        .action-card:hover:not(.disabled) { background: rgba(99,102,241,0.1); border-color: #6366f1; transform: translateY(-4px); }
        .action-card.disabled { opacity: 0.5; cursor: not-allowed; }
        .action-icon { font-size: 2rem; margin-bottom: 1rem; }
        .action-card h3 { font-size: 1.125rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.5rem; }
        .action-card p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; }
      `}</style>
        </div>
    );
}
