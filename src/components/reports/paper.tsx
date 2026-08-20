import type { CSSProperties, ReactNode } from "react";

/**
 * Primitivas de la vista previa de un informe en pantalla.
 *
 * Replican los componentes de `typst/lib/theme.typ` para que la previa sea el
 * mismo documento que se descarga y no una aproximación. Por eso la paleta es
 * fija y no sigue el tema claro/oscuro de la aplicación: un informe impreso no
 * tiene modo oscuro, y mostrarlo en gris sobre negro haría que el usuario viera
 * un documento distinto del que va a entregar.
 */

export const PAPER = {
    paper: "#FCFBFA",
    ink: "#16150F",
    ink2: "#57534E",
    ink3: "#8A857E",
    rule: "#E2DFDA",
    rule2: "#CFCBC4",
    panel: "#F5F3F0",
} as const;

export const RISK_COLOR: Record<string, string> = {
    SIN_RIESGO: "#3E7A63",
    BAJO: "#6F9558",
    MEDIO: "#C39A3B",
    ALTO: "#BE7039",
    MUY_ALTO: "#A34037",
};

export const RISK_KEYS = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"] as const;

export const RISK_LABEL: Record<string, string> = {
    SIN_RIESGO: "Sin riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy alto",
};

export const rc = (k: string) => RISK_COLOR[k] ?? PAPER.ink3;

const serif = "var(--font-report-serif), Georgia, serif";
const sans = "var(--font-report-sans), system-ui, sans-serif";

/** Hoja de papel: fija el fondo, la tinta y las dos familias tipográficas. */
export function Paper({ children }: { children: ReactNode }) {
    return (
        <div
            className="rounded-2xl border shadow-sm px-8 py-10 sm:px-12 sm:py-14"
            style={{
                background: PAPER.paper,
                color: PAPER.ink,
                borderColor: PAPER.rule,
                fontFamily: serif,
                // Mismo cuerpo que el PDF a escala de pantalla.
                fontSize: 15,
                lineHeight: 1.62,
            }}
        >
            {children}
        </div>
    );
}

/** Rótulo en versalitas: el equivalente de `label-text`. */
export function Label({
    children,
    color = PAPER.ink3,
    style,
}: {
    children: ReactNode;
    color?: string;
    style?: CSSProperties;
}) {
    return (
        <span
            style={{
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color,
                ...style,
            }}
        >
            {children}
        </span>
    );
}

/** Texto auxiliar en sans, siempre en bandera. */
export function Micro({
    children,
    size = 12,
    color = PAPER.ink2,
    style,
}: {
    children: ReactNode;
    size?: number;
    color?: string;
    style?: CSSProperties;
}) {
    return (
        <p style={{ fontFamily: sans, fontSize: size, lineHeight: 1.5, color, margin: 0, ...style }}>
            {children}
        </p>
    );
}

/** Cifras tabulares, para que las columnas de números alineen. */
export const numStyle: CSSProperties = { fontFamily: sans, fontVariantNumeric: "tabular-nums" };

export function SectionTitle({ n, children }: { n: number; children: ReactNode }) {
    return (
        <div style={{ marginTop: 40, marginBottom: 16 }}>
            <div style={{ height: 1.4, background: PAPER.ink }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10 }}>
                <span
                    style={{ fontFamily: sans, fontSize: 19, fontWeight: 600, color: PAPER.ink3 }}
                >
                    {n}
                </span>
                <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, margin: 0 }}>
                    {children}
                </h2>
            </div>
        </div>
    );
}

export function SubTitle({ children }: { children: ReactNode }) {
    return (
        <h3
            style={{
                fontFamily: serif,
                fontSize: 17,
                fontWeight: 600,
                margin: "26px 0 10px",
            }}
        >
            {children}
        </h3>
    );
}

/**
 * Escala de baremo: cinco bandas de igual ancho con el marcador interpolado
 * dentro de la suya. Anchos proporcionales al puntaje harían que la banda "muy
 * alto", que llega a 100, se comiera media escala.
 */
export function BandScale({
    bounds,
    value,
    height = 12,
}: {
    bounds: number[];
    value: number;
    height?: number;
}) {
    if (bounds.length === 0) return null;

    const n = bounds.length;
    let idx = n - 1;
    let frac = 1;
    for (let i = 0; i < n; i++) {
        if (value <= bounds[i]) {
            idx = i;
            const prev = i === 0 ? 0 : bounds[i - 1];
            frac = bounds[i] - prev > 0 ? (value - prev) / (bounds[i] - prev) : 0;
            break;
        }
    }
    const pos = ((idx + Math.min(Math.max(frac, 0), 1)) / n) * 100;

    return (
        <div>
            <div style={{ position: "relative", display: "flex", height }}>
                {RISK_KEYS.map(k => (
                    <div key={k} style={{ flex: 1, background: `${rc(k)}42` }} />
                ))}
                <div
                    style={{
                        position: "absolute",
                        left: `calc(${pos}% - 1.2px)`,
                        top: 0,
                        width: 2.4,
                        height,
                        background: PAPER.ink,
                    }}
                />
            </div>
            <div style={{ display: "flex", marginTop: 3 }}>
                {bounds.map((b, i) => (
                    <span
                        key={i}
                        style={{
                            ...numStyle,
                            flex: 1,
                            fontSize: 9,
                            color: PAPER.ink3,
                            textAlign: "right",
                        }}
                    >
                        {Math.round(b * 10) / 10}
                    </span>
                ))}
            </div>
        </div>
    );
}

/** Barra apilada de distribución de riesgo. */
export function StackedBar({
    dist,
    height = 10,
}: {
    dist: Record<string, number>;
    height?: number;
}) {
    const total = RISK_KEYS.reduce((s, k) => s + Math.max(dist[k] ?? 0, 0), 0);
    if (total === 0) return <div style={{ height, background: PAPER.rule }} />;

    return (
        <div style={{ display: "flex", height, overflow: "hidden" }}>
            {RISK_KEYS.map(k => {
                const v = Math.max(dist[k] ?? 0, 0);
                if (v === 0) return null;
                return <div key={k} style={{ flexGrow: v, background: rc(k) }} />;
            })}
        </div>
    );
}

export function RiskLegend() {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {RISK_KEYS.map(k => (
                <span key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 9, height: 9, background: rc(k) }} />
                    <span style={{ fontFamily: sans, fontSize: 10, color: PAPER.ink2 }}>
                        {RISK_LABEL[k]}
                    </span>
                </span>
            ))}
        </div>
    );
}

/** Distintivo de nivel con su puntaje. */
export function LevelChip({
    level,
    label,
    score,
}: {
    level: string;
    label: string;
    score?: number | string;
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 9px",
                background: `${rc(level)}24`,
                borderLeft: `2.5px solid ${rc(level)}`,
                whiteSpace: "nowrap",
            }}
        >
            <span
                style={{
                    fontFamily: sans,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: rc(level),
                }}
            >
                {label}
            </span>
            {score !== undefined && (
                <span style={{ ...numStyle, fontSize: 12.5, fontWeight: 600, color: PAPER.ink }}>
                    {score}
                </span>
            )}
        </span>
    );
}

export function NoteBlock({
    children,
    accent = PAPER.ink,
}: {
    children: ReactNode;
    accent?: string;
}) {
    return (
        <div
            style={{
                background: PAPER.panel,
                borderLeft: `3px solid ${accent}`,
                padding: "13px 16px",
                fontFamily: sans,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: PAPER.ink2,
            }}
        >
            {children}
        </div>
    );
}

export function StatCard({
    value,
    label,
    accent = PAPER.ink,
}: {
    value: ReactNode;
    label: string;
    accent?: string;
}) {
    return (
        <div
            style={{
                background: PAPER.panel,
                borderTop: `2.5px solid ${accent}`,
                padding: "14px 14px 16px",
            }}
        >
            <div style={{ ...numStyle, fontSize: 27, fontWeight: 600, color: accent }}>{value}</div>
            <div style={{ marginTop: 6 }}>
                <Label style={{ fontSize: 9 }}>{label}</Label>
            </div>
        </div>
    );
}

/** Celda del cuadrante 2×2 de grupos de intervención. */
export function QuadCell({
    tag,
    name,
    n,
    desc,
    accent,
}: {
    tag: string;
    name: string;
    n: number;
    desc: string;
    accent: string;
}) {
    return (
        <div
            style={{
                background: PAPER.panel,
                borderLeft: `3px solid ${accent}`,
                border: `1px solid ${PAPER.rule}`,
                borderLeftWidth: 3,
                borderLeftColor: accent,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}
        >
            <Label color={accent} style={{ fontSize: 9 }}>
                {tag}
            </Label>
            <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 600 }}>{name}</div>
            <div style={{ ...numStyle, fontSize: 30, fontWeight: 600, color: accent }}>{n}</div>
            <Micro size={11}>{desc}</Micro>
        </div>
    );
}

/** Tabla editorial: sólo filetes horizontales, texto en bandera. */
export function ETable({
    headers,
    align,
    rows,
}: {
    headers: string[];
    align?: ("left" | "center" | "right")[];
    rows: ReactNode[][];
}) {
    const at = (i: number) => align?.[i] ?? "left";
    return (
        <div style={{ overflowX: "auto" }}>
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: sans,
                    fontSize: 12.5,
                    color: PAPER.ink2,
                }}
            >
                <thead>
                    <tr style={{ borderTop: `1.6px solid ${PAPER.ink}` }}>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                style={{
                                    textAlign: at(i),
                                    padding: "9px 10px",
                                    borderBottom: `1.2px solid ${PAPER.ink}`,
                                    fontWeight: 600,
                                    fontSize: 9.5,
                                    letterSpacing: "0.09em",
                                    textTransform: "uppercase",
                                    color: PAPER.ink2,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, ri) => (
                        <tr key={ri} style={{ borderBottom: `1px solid ${PAPER.rule}` }}>
                            {r.map((c, ci) => (
                                <td
                                    key={ci}
                                    style={{
                                        textAlign: at(ci),
                                        padding: "9px 10px",
                                        verticalAlign: "middle",
                                    }}
                                >
                                    {c}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** Mapa de calor 5×5, normalizado contra el pico de la matriz. */
export function HeatMatrix({
    matrix,
    rowLabel,
    colLabel,
}: {
    matrix: number[][];
    rowLabel: string;
    colLabel: string;
}) {
    const peak = Math.max(1, ...matrix.flat());
    return (
        <div>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: `1px solid ${PAPER.rule}` }} />
                            {RISK_KEYS.map(k => (
                                <th
                                    key={k}
                                    style={{
                                        border: `1px solid ${PAPER.rule}`,
                                        padding: "7px 4px",
                                    }}
                                >
                                    <Label style={{ fontSize: 8.5, letterSpacing: "0.05em" }}>
                                        {RISK_LABEL[k]}
                                    </Label>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i}>
                                <th
                                    style={{
                                        border: `1px solid ${PAPER.rule}`,
                                        padding: "7px 8px",
                                        textAlign: "right",
                                    }}
                                >
                                    <Label style={{ fontSize: 8.5, letterSpacing: "0.05em" }}>
                                        {RISK_LABEL[RISK_KEYS[i]]}
                                    </Label>
                                </th>
                                {row.map((v, j) => {
                                    const t = v / peak;
                                    return (
                                        <td
                                            key={j}
                                            style={{
                                                ...numStyle,
                                                border: `1px solid ${PAPER.rule}`,
                                                padding: "9px 4px",
                                                textAlign: "center",
                                                fontWeight: 600,
                                                fontSize: 12.5,
                                                // Mismo criterio que el PDF: sobre
                                                // el 55% del pico el fondo es
                                                // demasiado oscuro para tinta.
                                                background:
                                                    v === 0
                                                        ? PAPER.paper
                                                        : `rgba(22,21,15,${0.18 + 0.62 * t})`,
                                                color: t > 0.55 ? PAPER.paper : PAPER.ink,
                                            }}
                                        >
                                            {v === 0 ? "·" : v}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <Label style={{ fontSize: 9 }}>{rowLabel}</Label>
                <Label style={{ fontSize: 9 }}>{colLabel}</Label>
            </div>
        </div>
    );
}
