"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Icons } from "@/components/icons";

interface ComingSoonProps {
    title: string;
    description: string;
    iconName?: keyof typeof Icons;
}

/**
 * Antes: un círculo índigo con un `animate-ping` de fondo — un color que no
 * existe en ningún otro sitio de la marca, sobre una animación que nunca
 * termina y no informa de nada. Es el placeholder por defecto de cualquier
 * generador de interfaces, no algo que se diseñó para PsicoSST.
 *
 * Ahora usa el teal de marca, entra una sola vez con el ritmo del resto del
 * sistema (Kowalski: curva de salida fuerte, sin rebote) y no repite el
 * gesto indefinidamente: lo que se ve cada vez que alguien visita la
 * página no necesita moverse para siempre.
 */
export function ComingSoon({ title, description, iconName = "dashboard" }: ComingSoonProps) {
    const Icon = Icons[iconName] || Icons.dashboard;
    const reduceMotion = useReducedMotion();

    return (
        <div className="flex-1 h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
            <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-md w-full text-center space-y-6"
            >
                <div
                    className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--color-teal-light)" }}
                >
                    <Icon className="w-7 h-7" style={{ color: "var(--color-teal-dark)" }} />
                </div>

                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">En construcción</p>
                    <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
                    <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
                        {description}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
