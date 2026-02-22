import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "PsicoSST",
    description: "Plataforma de evaluación de riesgo psicosocial para el SGSST colombiano",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="auth-layout">
            <div className="auth-bg" />
            <div className="auth-content">
                <div className="auth-brand">
                    <div className="auth-logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
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
                    </div>
                    <h1 className="auth-title">PsicoSST</h1>
                    <p className="auth-subtitle">Evaluación de Riesgo Psicosocial</p>
                </div>
                {children}
            </div>
            <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .auth-bg {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #16213e 50%, #0f0f23 100%);
          z-index: 0;
        }
        .auth-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-2%, 2%); }
        }
        .auth-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: 2rem;
        }
        .auth-brand {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-logo {
          display: inline-flex;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
        }
        .auth-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }
        .auth-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }
      `}</style>
        </div>
    );
}
