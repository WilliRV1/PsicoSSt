"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquare, X } from "lucide-react";

/**
 * Canal de comentarios del profesional.
 *
 * Un botón fijo, presente en todo el panel, porque el momento en que alguien
 * quiere contar algo es justo cuando se topa con el problema: si hay que
 * buscar el formulario en un menú, el comentario no llega.
 *
 * Registra además la ruta desde la que se envía, para no depender de que la
 * persona recuerde en qué pantalla estaba.
 */

type Tipo = "COMMENT" | "BUG";

const TIPOS: { valor: Tipo; etiqueta: string; ayuda: string }[] = [
    { valor: "BUG", etiqueta: "Algo falla", ayuda: "Qué intentabas hacer y qué ocurrió." },
    { valor: "COMMENT", etiqueta: "Sugerencia", ayuda: "Qué echas en falta o qué haría tu trabajo más fácil." },
];

export function FeedbackButton() {
    const pathname = usePathname();
    const [abierto, setAbierto] = useState(false);
    const [tipo, setTipo] = useState<Tipo>("BUG");
    const [mensaje, setMensaje] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState("");
    const areaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (abierto) areaRef.current?.focus();
    }, [abierto]);

    // Cerrar con Escape, como cualquier diálogo.
    useEffect(() => {
        if (!abierto) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") cerrar();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [abierto]);

    function cerrar() {
        setAbierto(false);
        // El estado de envío se limpia al cerrar, no al abrir, para que el
        // acuse de recibo siga visible mientras el panel está en pantalla.
        setTimeout(() => {
            setEnviado(false);
            setError("");
        }, 200);
    }

    async function enviar() {
        const texto = mensaje.trim();
        if (!texto) return;

        setEnviando(true);
        setError("");
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kind: tipo,
                    message: texto,
                    path: pathname,
                    context: { viewport: `${window.innerWidth}x${window.innerHeight}` },
                }),
            });
            if (!res.ok) {
                const cuerpo = await res.json().catch(() => null);
                throw new Error(cuerpo?.error ?? "No se pudo enviar");
            }
            setMensaje("");
            setEnviado(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo enviar");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <>
            <button
                onClick={() => (abierto ? cerrar() : setAbierto(true))}
                aria-label="Enviar comentario"
                className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-4 shadow-md transition-shadow hover:shadow-lg"
            >
                {abierto ? (
                    <X className="h-[18px] w-[18px] text-text-secondary" />
                ) : (
                    <MessageSquare className="h-[18px] w-[18px] text-primary" />
                )}
                <span
                    className="text-[13px] font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-barlow)" }}
                >
                    {abierto ? "Cerrar" : "Comentar"}
                </span>
            </button>

            {abierto && (
                <div
                    role="dialog"
                    aria-label="Enviar comentario"
                    className="fixed bottom-20 right-5 z-40 flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-elevated"
                >
                    {enviado ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                            <div className="flex flex-col gap-1">
                                <p className="text-[15px] font-semibold text-foreground">Recibido, gracias</p>
                                <p className="text-[13px] leading-relaxed text-text-secondary">
                                    Lo leo yo directamente. Si hace falta más detalle te escribo.
                                </p>
                            </div>
                            <button
                                onClick={() => setEnviado(false)}
                                className="text-[13px] font-medium text-teal-dark hover:underline"
                            >
                                Enviar otro
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1">
                                <p
                                    className="text-[15px] font-semibold text-foreground"
                                    style={{ fontFamily: "var(--font-barlow)" }}
                                >
                                    Cuéntame qué tal
                                </p>
                                <p className="text-[12.5px] leading-relaxed text-text-secondary">
                                    Esto va directo a quien desarrolla la plataforma.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {TIPOS.map(t => (
                                    <button
                                        key={t.valor}
                                        onClick={() => setTipo(t.valor)}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors ${
                                            tipo === t.valor
                                                ? "border-primary bg-teal-light text-foreground"
                                                : "border-border bg-background text-text-secondary hover:border-border-focus"
                                        }`}
                                    >
                                        {t.etiqueta}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                ref={areaRef}
                                value={mensaje}
                                onChange={e => setMensaje(e.target.value)}
                                placeholder={TIPOS.find(t => t.valor === tipo)?.ayuda}
                                rows={5}
                                maxLength={4000}
                                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-3 focus:ring-primary/12"
                            />

                            {error && <p className="text-[12.5px] text-danger">{error}</p>}

                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11.5px] leading-snug text-text-muted">
                                    Se envía la pantalla en la que estás. Ningún dato de trabajadores.
                                </p>
                                <button
                                    onClick={enviar}
                                    disabled={enviando || !mensaje.trim()}
                                    className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                                    style={{ fontFamily: "var(--font-barlow)" }}
                                >
                                    {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Enviar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
