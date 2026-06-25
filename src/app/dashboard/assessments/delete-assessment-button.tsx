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
            className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
            title="Eliminar evaluación"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </button>
    );
}
