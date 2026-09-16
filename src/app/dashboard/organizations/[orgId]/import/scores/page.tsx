"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    FileUp,
    Loader2,
    UploadCloud,
    X,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTRUMENTS, INSTRUMENT_IDS, sortByOrder } from "@/config/instruments";
import type { QuestionnaireType } from "@/types/battery";
import { getErrorMessage } from "@/lib/utils";

/**
 * Importación de puntajes ya calificados (SIRPSI u otra herramienta).
 *
 * El flujo es de tres pasos y se lee como tal —configurar, descargar la
 * plantilla, subir el archivo—, uno debajo del otro: en un teléfono cada paso
 * ocupa el ancho completo y no hay desplazamiento lateral salvo la tabla de
 * errores, que sí es tabular.
 *
 * Los colores del resultado salen de la escala de riesgo del sistema
 * (`--color-risk-low-*` para lo importado, `--color-risk-veryhigh-*` para lo
 * fallido) en vez de los verdes y rojos de la paleta por defecto de Tailwind,
 * que este tema no define.
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const SELECT_CLASS =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

interface ImportResult {
    jobId: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: { row: number; column?: string; message: string }[];
}

function tamano(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportScoresPage() {
    const params = useParams();
    const orgId = params.orgId as string;
    const reduceMotion = useReducedMotion();
    const inputRef = useRef<HTMLInputElement>(null);

    const [instrument, setInstrument] = useState<QuestionnaireType>("INTRALABORAL");
    const [formType, setFormType] = useState<"A" | "B">("A");
    const [source, setSource] = useState<"SIRPSI" | "OTRO">("SIRPSI");
    const [file, setFile] = useState<File | null>(null);
    const [arrastrando, setArrastrando] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const def = INSTRUMENTS[instrument];
    const templateUrl = `/api/imports/scores/template?instrument=${instrument}&formType=${formType}`;

    const limpiarArchivo = () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const body = new FormData();
            body.append("file", file);
            body.append("organizationId", orgId);
            body.append("source", source);
            const res = await fetch("/api/imports/scores", { method: "POST", body });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en la importación");
            setResult(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
            className="mx-auto w-full max-w-4xl space-y-6"
        >
            {/* Encabezado */}
            <div>
                <Link
                    href={`/dashboard/organizations/${orgId}`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a la empresa
                </Link>

                <div className="mt-4 flex items-start gap-3">
                    <span
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex"
                        style={{ background: "var(--color-teal-light)" }}
                    >
                        <FileUp className="h-5 w-5" style={{ color: "var(--color-teal-dark)" }} />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground sm:text-[24px]">
                            Importar resultados calificados
                        </h1>
                        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
                            Trae los puntajes ya calificados en SIRPSI u otra herramienta. Se importan los puntajes
                            transformados (0-100) por dimensión; el nivel de riesgo se calcula aquí con los baremos
                            vigentes. Las evaluaciones importadas quedan marcadas con su origen en el informe.
                        </p>
                    </div>
                </div>
            </div>

            {!result ? (
                <div className="space-y-4">
                    {/* Paso 1 — configuración */}
                    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <PasoTitulo
                            n={1}
                            titulo="Elige el instrumento y el origen"
                            descripcion="Define qué se está importando: eso determina las columnas de la plantilla."
                        />
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <label className="block">
                                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                                    Instrumento
                                </span>
                                <select
                                    className={SELECT_CLASS}
                                    value={instrument}
                                    onChange={(e) => setInstrument(e.target.value as QuestionnaireType)}
                                >
                                    {sortByOrder(INSTRUMENT_IDS).map((id) => (
                                        <option key={id} value={id}>
                                            {INSTRUMENTS[id].shortLabel}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                                    Forma
                                </span>
                                <select
                                    className={SELECT_CLASS}
                                    value={formType}
                                    disabled={!def.usesFormType}
                                    onChange={(e) => setFormType(e.target.value as "A" | "B")}
                                >
                                    <option value="A">A · jefes, profesionales y técnicos</option>
                                    <option value="B">B · auxiliares y operarios</option>
                                </select>
                                {!def.usesFormType && (
                                    <span className="mt-1.5 block text-[11px] text-text-muted">
                                        No aplica a {def.shortLabel}.
                                    </span>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                                    Origen
                                </span>
                                <select
                                    className={SELECT_CLASS}
                                    value={source}
                                    onChange={(e) => setSource(e.target.value as "SIRPSI" | "OTRO")}
                                >
                                    <option value="SIRPSI">SIRPSI (Ministerio del Trabajo)</option>
                                    <option value="OTRO">Otra herramienta</option>
                                </select>
                            </label>
                        </div>
                    </section>

                    {/* Paso 2 — plantilla */}
                    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <PasoTitulo
                            n={2}
                            titulo="Descarga la plantilla del instrumento"
                            descripcion={
                                <>
                                    Una fila por trabajador. Columnas: documento, instrumento, forma, fecha, una columna
                                    por dimensión (0-100) y{" "}
                                    <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px] text-foreground">
                                        total
                                    </code>
                                    {def.totalStrategy === "weighted"
                                        ? " (obligatoria en estrés)."
                                        : " (opcional)."}
                                </>
                            }
                        />
                        <Button asChild variant="outline" className="press-feedback mt-5 w-full sm:w-auto">
                            <a href={templateUrl} download>
                                <Download className="h-4 w-4" />
                                Plantilla CSV · {def.shortLabel}
                                {def.usesFormType ? ` ${formType}` : ""}
                            </a>
                        </Button>
                    </section>

                    {/* Paso 3 — archivo */}
                    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <PasoTitulo
                            n={3}
                            titulo="Sube el archivo diligenciado"
                            descripcion="Formato CSV, hasta una fila por trabajador evaluado."
                        />

                        {file ? (
                            <div
                                className="mt-5 flex items-center gap-3 rounded-xl border px-4 py-3.5"
                                style={{
                                    background: "var(--color-teal-light)",
                                    borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                                }}
                            >
                                <FileSpreadsheet
                                    className="h-5 w-5 shrink-0"
                                    style={{ color: "var(--color-teal-dark)" }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="truncate text-[14px] font-medium"
                                        style={{ color: "var(--color-teal-dark)" }}
                                    >
                                        {file.name}
                                    </p>
                                    <p
                                        className="font-mono text-[11px] tabular-nums"
                                        style={{ color: "var(--color-teal-dark)", opacity: 0.8 }}
                                    >
                                        {tamano(file.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={limpiarArchivo}
                                    disabled={loading}
                                    aria-label="Quitar archivo"
                                    className="press-feedback -mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-card disabled:opacity-50"
                                    style={{ color: "var(--color-teal-dark)" }}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label
                                htmlFor="import-scores-file"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setArrastrando(true);
                                }}
                                onDragLeave={() => setArrastrando(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setArrastrando(false);
                                    const soltado = e.dataTransfer.files?.[0];
                                    if (soltado) setFile(soltado);
                                }}
                                className="press-feedback mt-5 flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-5 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-primary/30 sm:py-10"
                                style={{
                                    borderColor: arrastrando ? "var(--color-primary)" : "var(--color-border)",
                                    background: arrastrando
                                        ? "var(--color-teal-light)"
                                        : "var(--color-surface-muted)",
                                }}
                            >
                                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-card">
                                    <UploadCloud className="h-5 w-5 text-text-muted" />
                                </span>
                                <span className="text-[15px] font-semibold text-foreground">
                                    Toca para elegir el archivo
                                </span>
                                <span className="mt-1 text-[13px] text-text-secondary">
                                    o arrástralo aquí · sólo .csv
                                </span>
                                <input
                                    ref={inputRef}
                                    id="import-scores-file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="sr-only"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                />
                            </label>
                        )}

                        {error && (
                            <p
                                role="alert"
                                className="mt-4 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] leading-snug"
                                style={{
                                    background: "var(--color-risk-veryhigh-bg)",
                                    borderColor: "var(--color-risk-veryhigh-border)",
                                    color: "var(--color-risk-veryhigh-text)",
                                }}
                            >
                                <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
                                <span className="min-w-0">{error}</span>
                            </p>
                        )}

                        <Button
                            onClick={handleImport}
                            disabled={!file || loading}
                            className="press-feedback mt-5 w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Importando…
                                </>
                            ) : (
                                "Importar resultados"
                            )}
                        </Button>
                    </section>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">
                                Filas leídas
                            </p>
                            <p className="mt-2 font-mono text-[28px] font-semibold leading-none tabular-nums text-foreground">
                                {result.totalRows}
                            </p>
                        </div>
                        <Tile
                            etiqueta="Importadas"
                            valor={result.successRows}
                            icono={CheckCircle2}
                            bg="var(--color-risk-low-bg)"
                            border="var(--color-risk-low-border)"
                            text="var(--color-risk-low-text)"
                        />
                        <Tile
                            etiqueta="Con error"
                            valor={result.failedRows}
                            icono={XCircle}
                            bg={
                                result.failedRows > 0
                                    ? "var(--color-risk-veryhigh-bg)"
                                    : "var(--color-surface-muted)"
                            }
                            border={
                                result.failedRows > 0
                                    ? "var(--color-risk-veryhigh-border)"
                                    : "var(--color-border)"
                            }
                            text={
                                result.failedRows > 0
                                    ? "var(--color-risk-veryhigh-text)"
                                    : "var(--color-text-secondary)"
                            }
                        />
                    </div>

                    {result.errors.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border-muted px-5 py-3.5">
                                <h2 className="text-[14px] font-semibold text-foreground">
                                    Filas que no se importaron
                                </h2>
                                <p className="mt-0.5 text-[12px] text-text-secondary">
                                    Corrige estas filas en el archivo y vuelve a subirlo: las ya importadas no se
                                    duplican.
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[480px] text-left text-[13px]">
                                    <thead
                                        style={{
                                            background: "var(--color-surface-muted)",
                                            borderBottom: "1px solid var(--color-border)",
                                        }}
                                    >
                                        <tr>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Fila
                                            </th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Columna
                                            </th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                                Error
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.errors.map((e, i) => (
                                            <tr
                                                key={`${e.row}-${e.column ?? ""}-${i}`}
                                                style={{
                                                    borderTop:
                                                        i > 0 ? "1px solid var(--color-border-muted)" : undefined,
                                                }}
                                            >
                                                <td className="whitespace-nowrap px-5 py-3 font-mono tabular-nums text-foreground">
                                                    {e.row}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3 font-mono text-text-secondary">
                                                    {e.column ?? "—"}
                                                </td>
                                                <td className="px-5 py-3 text-text-secondary">{e.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <p className="font-mono text-[11px] tabular-nums text-text-muted">
                        Registro de carga: {result.jobId}
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            variant="outline"
                            className="press-feedback w-full sm:w-auto"
                            onClick={() => {
                                setResult(null);
                                limpiarArchivo();
                                setError(null);
                            }}
                        >
                            Importar otro archivo
                        </Button>
                        <Button asChild className="press-feedback w-full sm:w-auto">
                            <Link href={`/dashboard/organizations/${orgId}`}>Ver empresa</Link>
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function PasoTitulo({
    n,
    titulo,
    descripcion,
}: {
    n: number;
    titulo: string;
    descripcion: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold tabular-nums"
                style={{ background: "var(--color-teal-light)", color: "var(--color-teal-dark)" }}
                aria-hidden="true"
            >
                {n}
            </span>
            <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{titulo}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{descripcion}</p>
            </div>
        </div>
    );
}

function Tile({
    etiqueta,
    valor,
    icono: Icono,
    bg,
    border,
    text,
}: {
    etiqueta: string;
    valor: number;
    icono: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    bg: string;
    border: string;
    text: string;
}) {
    return (
        <div className="rounded-xl border p-5" style={{ background: bg, borderColor: border }}>
            <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.09em]"
                style={{ color: text }}
            >
                <Icono className="h-3.5 w-3.5 shrink-0" style={{ color: text }} />
                {etiqueta}
            </p>
            <p
                className="mt-2 font-mono text-[28px] font-semibold leading-none tabular-nums"
                style={{ color: text }}
            >
                {valor}
            </p>
        </div>
    );
}
