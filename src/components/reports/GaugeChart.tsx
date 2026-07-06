"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
    value: number;
    title: string;
    baremos: { maxSinRiesgo: number, maxBajo: number, maxMedio: number, maxAlto: number, maxMuyAlto: number };
}

const RADIAN = Math.PI / 180;

export const GaugeChart: React.FC<GaugeChartProps> = ({ value, title, baremos }) => {
    const total = baremos.maxMuyAlto;
    
    const data = [
        { name: 'Sin Riesgo', value: baremos.maxSinRiesgo, color: '#10B981' },
        { name: 'Bajo', value: baremos.maxBajo - baremos.maxSinRiesgo, color: '#3B82F6' },
        { name: 'Medio', value: baremos.maxMedio - baremos.maxBajo, color: '#F59E0B' },
        { name: 'Alto', value: baremos.maxAlto - baremos.maxMedio, color: '#EF4444' },
        { name: 'Muy Alto', value: baremos.maxMuyAlto - baremos.maxAlto, color: '#7F1D1D' },
    ];

    const cx = 150;
    const cy = 120;
    const iR = 60;
    const oR = 100;

    const needle = (value: number, total: number, cx: number, cy: number, iR: number, oR: number, color: string) => {
        let percent = value / total;
        if (percent > 1) percent = 1;
        const ang = 180.0 * (1 - percent);
        const length = (iR + 2 * oR) / 3;
        const sin = Math.sin(-RADIAN * ang);
        const cos = Math.cos(-RADIAN * ang);
        const r = 5;
        const x0 = cx;
        const y0 = cy;
        const xba = x0 + r * sin;
        const yba = y0 - r * cos;
        const xbb = x0 - r * sin;
        const ybb = y0 + r * cos;
        const xp = x0 + length * cos;
        const yp = y0 + length * sin;

        return [
            <circle key="circle" cx={x0} cy={y0} r={r} fill={color} stroke="none" />,
            <path key="path" d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="none" fill={color} />,
        ];
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-700 text-center h-10">{title}</h3>
            <div style={{ width: 300, height: 160 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            data={data}
                            cx={cx}
                            cy={cy}
                            innerRadius={iR}
                            outerRadius={oR}
                            fill="#8884d8"
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        {needle(value, total, cx, cy, iR, oR, '#1f2937')}
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-2xl font-black text-gray-800 -mt-8">{value.toFixed(1)}</div>
        </div>
    );
};
