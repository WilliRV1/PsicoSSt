"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, X } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export default function InvitationActions({ id }: { id: string }) {
    const [isBusy, setIsBusy] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const router = useRouter();

    const handleResend = async () => {
        setIsBusy(true);
        try {
            const res = await fetch(`/api/assessments/invitations/${id}/resend`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al reenviar");
            await navigator.clipboard.writeText(data.url);
            setCopiedUrl(data.url);
            setTimeout(() => setCopiedUrl(null), 3000);
        } catch (error: unknown) {
            alert(getErrorMessage(error));
        } finally {
            setIsBusy(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Cancelar esta invitación? El enlace dejará de funcionar de inmediato.")) return;
        setIsBusy(true);
        try {
            const res = await fetch(`/api/assessments/invitations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel" }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al cancelar");
            }
            router.refresh();
        } catch (error: unknown) {
            alert(getErrorMessage(error));
            setIsBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-1.5 mt-0.5">
            <button
                onClick={handleResend}
                disabled={isBusy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border border-border bg-surface hover:bg-surface-muted transition-colors text-foreground disabled:opacity-50"
                title="Reenviar enlace (genera uno nuevo y copia al portapapeles)"
            >
                {copiedUrl ? <Check className="w-3 h-3" style={{ color: "var(--color-success)" }} /> : <Copy className="w-3 h-3" />}
                {copiedUrl ? "Copiado" : "Reenviar"}
            </button>
            <button
                onClick={handleCancel}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded text-[11px] font-medium px-2.5 py-1.5 transition-colors disabled:opacity-50"
                style={{ border: "1px solid var(--color-risk-veryhigh-border)", background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" }}
                title="Cancelar invitación"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}
