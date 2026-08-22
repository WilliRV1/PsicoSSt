import { cn } from "@/lib/utils";

/**
 * Marca PsicoSST.
 *
 * El isotipo es un grafo de nodos —la lectura es la red de factores
 * psicosociales— trazado como SVG en lugar del PNG que se usaba antes: escala
 * a cualquier tamaño, cambia de color con el tema y no pesa nada.
 *
 * Se usa la variante compacta de nodos macizos, y no la detallada de nodos
 * anillados del logotipo original, porque los anillos se cierran por debajo de
 * unos 40 px y la marca se empasta justo en los tamaños donde más aparece:
 * barra lateral, favicon, avatar.
 */

interface LogoProps {
    className?: string;
    /** Sólo el isotipo, sin el nombre. */
    iconOnly?: boolean;
    /** Marca apilada en lugar de en línea. */
    stacked?: boolean;
    /** Sobre fondo oscuro. */
    light?: boolean;
    /** Alto del isotipo en píxeles. */
    size?: number;
}

/**
 * Encuadre ajustado al trazo.
 *
 * Las coordenadas de los nodos van de 2,4 a 41,6 en vertical, así que un
 * viewBox de 0 0 40 44 deja un margen interno que hace que la marca se vea
 * más pequeña de lo que se le pide. Se recorta al contenido y el aire lo pone
 * quien la coloca.
 */
const VIEW_BOX = "2.2 2.2 35.6 39.6";
const RATIO = 35.6 / 39.6;

/**
 * Identificador fijo del degradado.
 *
 * Varias instancias del isotipo comparten el mismo id, lo que normalmente
 * sería un error: `url(#id)` resuelve al primero del documento. Aquí es
 * inocuo porque todas las instancias declaran exactamente el mismo degradado,
 * sobre las mismas coordenadas del viewBox. En unidades de caja el degradado
 * se aplicaría a cada trazo por separado y la marca se volvería un revoltijo
 * de colores en vez de una transición de izquierda a derecha.
 * La alternativa —un contador— genera ids distintos en el servidor y en el
 * cliente, y React falla la hidratación.
 */
const GRADIENT_ID = "psicosst-mark";

export function Isotipo({ size = 32, className }: { size?: number; className?: string }) {
    return (
        <svg
            viewBox={VIEW_BOX}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={size * RATIO}
            height={size}
            className={className}
            aria-hidden="true"
        >
            <defs>
                <linearGradient
                    id={GRADIENT_ID}
                    x1="4"
                    y1="22"
                    x2="36"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#0FD6A0" />
                    <stop offset=".5" stopColor="#0FB3DA" />
                    <stop offset="1" stopColor="#2C6BFF" />
                </linearGradient>
            </defs>
            <g
                stroke={`url(#${GRADIENT_ID})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M20 7V37" />
                <path d="M20 7 7 15" />
                <path d="M7 15 7 30" />
                <path d="M7 30 20 37" />
                <path d="M20 7 33 15" />
                <path d="M33 15 33 30" />
                <path d="M33 30 20 37" />
                <path d="M7 15 33 30" />
                <path d="M33 15 7 30" />
            </g>
            <g fill={`url(#${GRADIENT_ID})`}>
                <circle cx="20" cy="7" r="4.6" />
                <circle cx="20" cy="37" r="4.6" />
                <circle cx="7" cy="15" r="4" />
                <circle cx="33" cy="15" r="4" />
                <circle cx="7" cy="30" r="4" />
                <circle cx="33" cy="30" r="4" />
                <circle cx="20" cy="22" r="4.2" />
            </g>
        </svg>
    );
}

export function Logo({ className, iconOnly = false, stacked = false, light = false, size = 32 }: LogoProps) {
    if (iconOnly) {
        return <Isotipo size={size} className={className} />;
    }

    const nombre = (
        <span
            style={{
                fontFamily: "var(--font-barlow)",
                fontWeight: 700,
                fontSize: `${size * 0.72}px`,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: light ? "#EEF4F9" : "var(--color-foreground)",
            }}
        >
            Psico<span style={{ color: light ? "#21C8E0" : "var(--color-primary)" }}>SST</span>
        </span>
    );

    const bajada = (
        <span
            style={{
                fontSize: `${Math.max(size * 0.27, 8.5)}px`,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: light ? "#5B7085" : "var(--color-text-muted)",
                lineHeight: 1,
            }}
        >
            Riesgo psicosocial
        </span>
    );

    if (stacked) {
        return (
            <div className={cn("flex flex-col items-center gap-2.5", className)}>
                <Isotipo size={size * 1.35} />
                <div className="flex flex-col items-center gap-1.5">
                    {nombre}
                    {bajada}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Isotipo size={size} />
            <div className="flex flex-col gap-1">
                {nombre}
                {bajada}
            </div>
        </div>
    );
}
