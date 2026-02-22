"use client";

import { signOut } from "next-auth/react";

export default function PendingApprovalPage() {
  return (
    <>
      <div className="card">
        <div className="pending-icon">⏳</div>
        <h2 className="card-title">Cuenta en Revisión</h2>
        <p className="card-description">
          Tu solicitud de registro ha sido recibida y está siendo revisada por un administrador.
          Recibirás acceso una vez que se verifiquen tus credenciales profesionales.
        </p>
        <div className="info-box">
          <p><strong>¿Qué se verifica?</strong></p>
          <ul>
            <li>Licencia SST vigente</li>
            <li>Tarjeta profesional de psicólogo</li>
            <li>Posgrado en Seguridad y Salud en el Trabajo</li>
          </ul>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary"
        >
          Cerrar Sesión
        </button>
      </div>

      <style>{`
        .card {
          background: rgba(30, 30, 60, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          text-align: center;
        }
        .pending-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .card-title { font-size: 1.25rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.75rem; }
        .card-description { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1.25rem; }
        .info-box {
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          text-align: left;
          margin-bottom: 1.5rem;
        }
        .info-box p { font-size: 0.8125rem; font-weight: 600; color: #c7d2fe; margin-bottom: 0.5rem; }
        .info-box ul { list-style: none; padding: 0; margin: 0; }
        .info-box li { font-size: 0.8125rem; color: #94a3b8; padding: 0.25rem 0; padding-left: 1rem; position: relative; }
        .info-box li::before { content: '✓'; position: absolute; left: 0; color: #6366f1; font-size: 0.75rem; }
        .btn-secondary {
          display: inline-block; padding: 0.625rem 1.25rem;
          background: transparent;
          border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px;
          color: #818cf8; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover { background: rgba(99, 102, 241, 0.1); }
      `}</style>
    </>
  );
}
