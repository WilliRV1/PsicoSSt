import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "PsicoSST - Acceso",
    description: "Plataforma de evaluacion de riesgo psicosocial para el SGSST colombiano",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children;
}
