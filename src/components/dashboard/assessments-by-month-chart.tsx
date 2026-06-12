"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export interface MonthlyData {
    month: string;
    label: string;
    intralaboral: number;
    extralaboral: number;
    stress: number;
}

interface Props {
    data: MonthlyData[];
}

export default function AssessmentsByMonthChart({ data }: Props) {
    if (data.every(d => d.intralaboral === 0 && d.extralaboral === 0 && d.stress === 0)) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sin evaluaciones en los últimos 12 meses.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--foreground)",
                    }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="intralaboral" name="Intralaboral" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="extralaboral" name="Extralaboral" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="stress" name="Estrés" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
