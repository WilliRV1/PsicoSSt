"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceArea,
} from "recharts";

interface Assessment {
    id: string;
    assessmentDate: string;
    questionnaireType: string;
    scoredResult: { overallRiskCategory: string; totalScores: any } | null;
}

interface Props {
    assessments: Assessment[];
}

const RISK_CATEGORY_LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

const LINE_COLORS: Record<string, string> = {
    INTRALABORAL: "#6366f1",
    EXTRALABORAL: "#22c55e",
    STRESS: "#f59e0b",
};

const LINE_DISPLAY_NAMES: Record<string, string> = {
    INTRALABORAL: "Intralaboral",
    EXTRALABORAL: "Extralaboral",
    STRESS: "Estrés",
};

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return date
        .toLocaleDateString("es-CO", { month: "short", year: "2-digit" })
        .replace(".", "")
        .replace(/^\w/, (c) => c.toUpperCase());
}

function getTransformedScore(scoredResult: { overallRiskCategory: string; totalScores: any }): number | undefined {
    const ts = scoredResult.totalScores;
    if (ts == null) return undefined;
    if (typeof ts.transformedScore === "number") return ts.transformedScore;
    if (typeof ts.percentile === "number") return ts.percentile;
    if (typeof ts.score === "number") return ts.score;
    return undefined;
}

interface ChartDataPoint {
    date: string;
    rawDate: string;
    INTRALABORAL?: number;
    EXTRALABORAL?: number;
    STRESS?: number;
    INTRALABORAL_category?: string;
    EXTRALABORAL_category?: string;
    STRESS_category?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((entry) => {
                const displayName = LINE_DISPLAY_NAMES[entry.dataKey] ?? entry.dataKey;
                return (
                    <div key={entry.dataKey} className="flex items-center gap-2">
                        <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{displayName}:</span>
                        <span className="font-medium">{entry.value.toFixed(1)}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function WorkerTrendChart({ assessments }: Props) {
    const scored = assessments.filter((a) => a.scoredResult != null);

    if (scored.length < 2) {
        return (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
                Se necesitan al menos 2 evaluaciones del mismo tipo para mostrar la tendencia.
            </p>
        );
    }

    // Build map: rawDate -> ChartDataPoint
    const dateMap = new Map<string, ChartDataPoint>();

    for (const assessment of scored) {
        const rawDate = assessment.assessmentDate;
        const label = formatDateLabel(rawDate);
        const score = getTransformedScore(assessment.scoredResult!);
        if (score === undefined) continue;

        if (!dateMap.has(rawDate)) {
            dateMap.set(rawDate, { date: label, rawDate });
        }

        const point = dateMap.get(rawDate)!;
        const type = assessment.questionnaireType as "INTRALABORAL" | "EXTRALABORAL" | "STRESS";

        if (type === "INTRALABORAL" || type === "EXTRALABORAL" || type === "STRESS") {
            point[type] = score;
            (point as any)[`${type}_category`] = assessment.scoredResult!.overallRiskCategory;
        }
    }

    // Sort by date ascending
    const chartData: ChartDataPoint[] = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
    );

    const activeTypes = (["INTRALABORAL", "EXTRALABORAL", "STRESS"] as const).filter((type) =>
        chartData.some((d) => d[type] !== undefined)
    );

    if (chartData.length < 2) {
        return (
            <p className="text-sm text-muted-foreground text-center py-6 italic">
                Se necesitan al menos 2 evaluaciones del mismo tipo para mostrar la tendencia.
            </p>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                {/* Risk color bands */}
                <ReferenceArea y1={0} y2={20} fill="#f0fdf4" fillOpacity={1} ifOverflow="hidden" />
                <ReferenceArea y1={20} y2={40} fill="#f7fee7" fillOpacity={1} ifOverflow="hidden" />
                <ReferenceArea y1={40} y2={60} fill="#fefce8" fillOpacity={1} ifOverflow="hidden" />
                <ReferenceArea y1={60} y2={80} fill="#fff7ed" fillOpacity={1} ifOverflow="hidden" />
                <ReferenceArea y1={80} y2={100} fill="#fef2f2" fillOpacity={1} ifOverflow="hidden" />

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                    formatter={(value: string) => LINE_DISPLAY_NAMES[value] ?? value}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                />

                {activeTypes.map((type) => (
                    <Line
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stroke={LINE_COLORS[type]}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 0, fill: LINE_COLORS[type] }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                        strokeDasharray={undefined}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
