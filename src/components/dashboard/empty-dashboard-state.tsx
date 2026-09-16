"use client";

import { useState } from "react";
import { Building2, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CreateOrganizationModal from "@/components/dashboard/create-organization-modal";
import { useRouter } from "next/navigation";

export default function EmptyDashboardState({ firstName }: { firstName: string }) {
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-4"
        >
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "var(--color-teal-light)" }}
            >
                <Building2 className="w-7 h-7" style={{ color: "var(--color-teal-dark)" }} />
            </div>

            <h1 className="text-[26px] font-semibold text-foreground mb-2 text-center tracking-[-0.02em]">
                Bienvenido/a, {firstName}
            </h1>

            <p className="text-[14px] text-text-secondary text-center max-w-md mb-8 leading-relaxed">
                Aún no tiene empresas registradas. Cree la primera para empezar a aplicar la
                batería y generar informes.
            </p>

            <Button size="lg" onClick={() => setShowModal(true)} className="press-feedback gap-2">
                Crear primera empresa
                <ArrowRight className="w-4 h-4" />
            </Button>

            <CreateOrganizationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    router.refresh();
                }}
            />
        </motion.div>
    );
}
