import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    AreaChart,
    Area,
    CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

// --- Types ---

interface ChartProps {
    data: any[];
    colors?: string[];
    height?: number;
}

interface PieChartProps {
    value: number;
    total: number;
    label: string;
    subLabel?: string;
    color: string;
}

// --- Components ---

/**
 * A sleek circular progress chart showing "Value / Total"
 */
export const AnimatedPieChart: React.FC<PieChartProps> = ({
    value,
    total,
    label,
    subLabel,
    color,
}) => {
    // const percentage = Math.min(100, Math.max(0, (value / total) * 100));
    const data = [
        { name: "Used", value: value },
        { name: "Remaining", value: total - value },
    ];

    return (
        <div className="relative flex h-full flex-col items-center justify-center">
            <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="used" fill={color} />
                            <Cell key="remaining" fill="#e5e7eb" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-gray-800"
                    >
                        {value}
                    </motion.span>
                    <span className="text-xs font-medium text-gray-400">/ {total}</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                <h4 className="text-lg font-semibold text-gray-700">{label}</h4>
                {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
            </div>
        </div>
    );
};

/**
 * A bar chart for comparing module activity
 */
export const ActivityBarChart: React.FC<ChartProps> = ({
    data,
    colors = ["#0B3D91"],
    height = 300,
}) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                />
                <Bar
                    dataKey="value"
                    fill={colors[0]}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

/**
 * An area chart for showing trends
 */
export const TrendAreaChart: React.FC<ChartProps & { color: string }> = ({
    data,
    color,
    height = 200,
}) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    fillOpacity={1}
                    fill={`url(#gradient-${color})`}
                    strokeWidth={2}
                    animationDuration={2000}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
