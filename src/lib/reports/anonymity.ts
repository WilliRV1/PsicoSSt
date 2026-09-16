/**
 * Umbral único de anonimato de los informes agregados.
 *
 * La Res. 2646/2008 art. 11 y la Ley 1581/2012 reservan el resultado individual:
 * al empleador sólo se le entregan agregados que no permitan reidentificar a
 * nadie. El producto llegó a tener tres pisos distintos —diez en el informe
 * diagnóstico, cinco en el diagnóstico por IA y ninguno en el sociodemográfico—
 * de modo que el mismo dato quedaba reservado o publicado según por qué pantalla
 * saliera. Aquí queda uno solo.
 */

/**
 * Número mínimo de TRABAJADORES para reportar un grupo por separado.
 *
 * El umbral se cuenta sobre trabajadores distintos, no sobre evaluaciones. A
 * cada persona se le aplican hasta tres cuestionarios, de modo que contar
 * evaluaciones dejaría pasar un área de cuatro personas —doce evaluaciones— y
 * el piso quedaría desfasado por un factor de tres.
 */
export const MIN_GROUP_SIZE = 10;

export function meetsMinGroupSize(n: number): boolean {
    return n >= MIN_GROUP_SIZE;
}

/** Qué se dejó fuera de un agregado por no alcanzar el umbral. */
export interface SuppressionSummary {
    /** true si al menos una categoría quedó fuera. */
    suppressed: boolean;
    /** Categorías omitidas. */
    suppressedGroups: number;
    /**
     * Trabajadores que quedaron fuera del agregado publicado.
     *
     * Se informa el total y no el desglose por categoría precisamente para que
     * el lector sepa que faltan personas sin poder deducir en qué casilla
     * estaban. Con una sola categoría suprimida el total coincide con su
     * tamaño, pero lo que la reserva protege es el ATRIBUTO —el estrato, el
     * nivel de riesgo—, no el hecho de que existan n personas sin clasificar.
     */
    suppressedCount: number;
    /** Umbral aplicado, para que el informe pueda citarlo. */
    minGroupSize: number;
}

export interface SuppressedCounts extends SuppressionSummary {
    /** Categorías que sí alcanzan el umbral, con su conteo. */
    counts: Record<string, number>;
}

/**
 * Suprime las categorías por debajo del umbral.
 *
 * No se reagrupan en un "otros": si el residual también queda bajo umbral, la
 * resta contra el total permite deducir exactamente el valor que se quiso
 * ocultar. Se omiten y se declara cuántas personas se omitieron.
 */
export function suppressSmallCounts(counts: Record<string, number>): SuppressedCounts {
    const kept: Record<string, number> = {};
    let suppressedGroups = 0;
    let suppressedCount = 0;

    for (const [label, n] of Object.entries(counts)) {
        if (n === 0) {
            // Una casilla vacía no identifica a nadie y su ausencia sí se
            // notaría en las distribuciones de categorías fijas (rangos de
            // edad, antigüedad), así que se conserva en cero.
            kept[label] = 0;
            continue;
        }
        if (meetsMinGroupSize(n)) {
            kept[label] = n;
        } else {
            suppressedGroups++;
            suppressedCount += n;
        }
    }

    return {
        counts: kept,
        suppressed: suppressedGroups > 0,
        suppressedGroups,
        suppressedCount,
        minGroupSize: MIN_GROUP_SIZE,
    };
}

/** Distribución publicable: porcentajes sobre el total, ya suprimida. */
export interface SuppressedDistribution extends SuppressionSummary {
    distribution: Record<string, number>;
}

/**
 * Convierte conteos a porcentajes sobre `total` suprimiendo las casillas por
 * debajo del umbral. El denominador es el total real y no el publicado: con el
 * denominario recortado los porcentajes sumarían 100 y negarían que falta algo.
 */
export function toSuppressedPercentages(
    counts: Record<string, number>,
    total: number
): SuppressedDistribution {
    const { counts: kept, ...summary } = suppressSmallCounts(counts);
    const distribution: Record<string, number> = {};

    if (total > 0) {
        for (const [label, n] of Object.entries(kept)) {
            distribution[label] = Math.round((n / total) * 100);
        }
    }

    return { distribution, ...summary };
}

/** Respuesta estándar cuando la población entera queda por debajo del umbral. */
export function belowThresholdPayload(totalWorkers: number) {
    return {
        suppressed: true as const,
        totalWorkers,
        minGroupSize: MIN_GROUP_SIZE,
        error:
            `No se pueden producir distribuciones agregadas con menos de ${MIN_GROUP_SIZE} ` +
            "trabajadores: cualquier porcentaje equivaldría a un resultado individual, " +
            "reservado por la Res. 2646/2008 art. 11 y la Ley 1581/2012.",
    };
}
