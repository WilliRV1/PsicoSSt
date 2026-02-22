"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="sign-out-btn"
        >
            Cerrar sesión
            <style>{`
        .sign-out-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #f87171;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sign-out-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.5);
        }
      `}</style>
        </button>
    );
}
