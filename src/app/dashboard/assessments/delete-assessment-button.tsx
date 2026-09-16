"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteAssessmentButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta evaluación? Esta acción no se puede deshacer.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/assessments/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al eliminar");
            }

            router.refresh();
        } catch (error: any) {
            alert(error.message);
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
            style={{ border: "1px solid var(--color-risk-veryhigh-border)", background: "var(--color-risk-veryhigh-bg)", color: "var(--color-risk-veryhigh-text)" }}
            title="Eliminar evaluación"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    );
}
