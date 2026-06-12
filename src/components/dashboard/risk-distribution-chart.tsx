"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
    SIN_RIESGO: "#22c55e",
    BAJO: "#84cc16",
    MEDIO: "#eab308",
    ALTO: "#f97316",
    MUY_ALTO: "#ef4444",
};

const LABELS: Record<string, string> = {
    SIN_RIESGO: "Sin Riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy Alto",
};

interface RiskItem {
    key: string;
    count: number;
}

interface Props {
    data: RiskItem[];
    total: number;
}

export default function RiskDistributionChart({ data, total }: Props) {
    if (data.length === 0) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sin datos de riesgo disponibles.
            </div>
        );
    }

    const chartData = data.map(d => ({
        name: LABELS[d.key] ?? d.key,
        value: d.count,
        key: d.key,
    }));

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                >
                    {chartData.map((entry) => (
                        <Cell key={entry.key} fill={COLORS[entry.key] ?? "#94a3b8"} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0} (${total > 0 ? (((value ?? 0) / total) * 100).toFixed(0) : 0}%)`, "Evaluaciones"]}
                    contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--foreground)",
                    }}
                />
                <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => value}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
